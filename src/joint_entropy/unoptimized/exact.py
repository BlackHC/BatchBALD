import torch
from torch_utils import split_tensors


def joint_probs_M_K(probs_N_K_C, prev_joint_probs_M_K=None):
    if prev_joint_probs_M_K is not None:
        assert prev_joint_probs_M_K.shape[1] == probs_N_K_C.shape[1]

    N, K, C = probs_N_K_C.shape
    probs_N_K_C = probs_N_K_C.double()

    if prev_joint_probs_M_K is None:
        prev_joint_probs_K_M_1 = None
    else:
        prev_joint_probs_K_M_1 = prev_joint_probs_M_K.t()[:, :, None]

    # Using lots of memory.
    for i in range(N):
        i_K_1_C = probs_N_K_C[i][:, None, :]
        if prev_joint_probs_K_M_1 is not None:
            joint_probs_K_M_C = prev_joint_probs_K_M_1 * i_K_1_C
        else:
            joint_probs_K_M_C = i_K_1_C
        prev_joint_probs_K_M_1 = joint_probs_K_M_C.reshape((K, -1, 1))

    if prev_joint_probs_K_M_1 is None:
        return None

    prev_joint_probs_M_K = prev_joint_probs_K_M_1.squeeze(2).t()
    return prev_joint_probs_M_K


def entropy_from_M_K(joint_probs_M_K):
    probs_M = torch.mean(joint_probs_M_K, dim=1, keepdim=False)
    nats_M = -torch.log(probs_M) * probs_M
    entropy = torch.sum(nats_M)
    return entropy


def batch(probs_B_K_C, prev_joint_probs_M_K=None):
    if prev_joint_probs_M_K is not None:
        assert prev_joint_probs_M_K.shape[1] == probs_B_K_C.shape[1]

    device = probs_B_K_C.device
    B, K, C = probs_B_K_C.shape
    probs_B_K_C = probs_B_K_C.double()

    if prev_joint_probs_M_K is None:
        prev_joint_probs_M_K = torch.ones((1, K), dtype=torch.float64, device=device)

    M = prev_joint_probs_M_K.shape[0]
    joint_probs_B_M_C = torch.empty((B, M, C), dtype=torch.float64, device=device)

    for i in range(B):
        torch.matmul(prev_joint_probs_M_K, probs_B_K_C[i], out=joint_probs_B_M_C[i])

    joint_probs_B_M_C /= K

    # Now we can compute the entropy.
    entropy_B = torch.zeros((B,), dtype=torch.float64, device=device)

    chunk_size = 256
    for entropy_b, joint_probs_b_M_C in split_tensors(entropy_B, joint_probs_B_M_C, chunk_size):
        entropy_b.copy_(torch.sum(-joint_probs_b_M_C * torch.log(joint_probs_b_M_C), dim=(1, 2)), non_blocking=True)

    return entropy_B


def batch_conditional_entropy_B(logits_B_K_C, out_conditional_entropy_B=None):
    B, K, C = logits_B_K_C.shape

    if out_conditional_entropy_B is None:
        out_conditional_entropy_B = torch.empty((B,), dtype=torch.float64)
    else:
        assert out_conditional_entropy_B.shape == (B,)

    for conditional_entropy_b, logits_b_K_C in split_tensors(out_conditional_entropy_B, logits_B_K_C, 8192):
        logits_b_K_C = logits_b_K_C.double()
        conditional_entropy_b.copy_(
            torch.sum(-logits_b_K_C * torch.exp(logits_b_K_C), dim=(1, 2)) / K, non_blocking=True
        )

    return out_conditional_entropy_B
