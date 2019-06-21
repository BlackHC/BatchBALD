import torch
from torch import jit

from torch_utils import batch_multi_choices, gather_expand, split_tensors

# probs_N_K_C: #ys x #ws x #classes
# samples_K_M: samples x #ws
# samples = #ws * num_samples_per_w
def sample_M_K_unified(probs_N_K_C, S=1000):
    probs_N_K_C = probs_N_K_C.double()

    K = probs_N_K_C.shape[1]

    choices_N_1_M = batch_multi_choices(torch.mean(probs_N_K_C, dim=1, keepdim=True), S * K).long()
    probs_N_K_M = gather_expand(probs_N_K_C, dim=-1, index=choices_N_1_M)

    # exp sum log seems necessary to avoid 0s?
    # probs_K_M = torch.exp(torch.sum(torch.log(probs_N_K_M), dim=0, keepdim=False))
    probs_K_M = torch.prod(probs_N_K_M, dim=0, keepdim=False)

    samples_M_K = probs_K_M.t()
    return samples_M_K


# probs_N_K_C: #ys x #ws x #classes
# samples_K_M: samples x #ws
# samples = #ws * num_samples_per_w
def sample_M_K(probs_N_K_C, S=1000):
    probs_N_K_C = probs_N_K_C.double()

    K = probs_N_K_C.shape[1]

    choices_N_K_S = batch_multi_choices(probs_N_K_C, S).long()

    expanded_choices_N_K_K_S = choices_N_K_S[:, None, :, :]
    expanded_probs_N_K_K_C = probs_N_K_C[:, :, None, :]

    probs_N_K_K_S = gather_expand(expanded_probs_N_K_K_C, dim=-1, index=expanded_choices_N_K_K_S)
    # exp sum log seems necessary to avoid 0s?
    probs_K_K_S = torch.exp(torch.sum(torch.log(probs_N_K_K_S), dim=0, keepdim=False))
    samples_K_M = probs_K_K_S.reshape((K, -1))

    samples_M_K = samples_K_M.t()
    return samples_M_K


@jit.script
def from_M_K(samples_M_K):
    probs_M = torch.mean(samples_M_K, dim=1, keepdim=False)
    nats_M = -torch.log(probs_M)
    entropy = torch.mean(nats_M)
    return entropy


# batch_ws_ps: #batch x #ws x #classes
# prev_ws_samples: #ws x samples
# entropy: #batch
def batch(probs_B_K_C, samples_M_K):
    probs_B_K_C = probs_B_K_C.double()
    samples_M_K = samples_M_K.double()

    device = probs_B_K_C.device
    M, K = samples_M_K.shape
    B, K_, C = probs_B_K_C.shape
    assert K == K_

    p_B_M_C = torch.empty((B, M, C), dtype=torch.float64, device=device)

    for i in range(B):
        torch.matmul(samples_M_K, probs_B_K_C[i], out=p_B_M_C[i])

    p_B_M_C /= K

    q_1_M_1 = samples_M_K.mean(dim=1, keepdim=True)[None]

    # Now we can compute the entropy.
    # We store it directly on the CPU to save GPU memory.
    entropy_B = torch.zeros((B,), dtype=torch.float64)

    chunk_size = 256
    for entropy_b, p_b_M_C in split_tensors(entropy_B, p_B_M_C, chunk_size):
        entropy_b.copy_(importance_weighted_entropy_p_b_M_C(p_b_M_C, q_1_M_1, M), non_blocking=True)

    return entropy_B


@jit.script
def importance_weighted_entropy_p_b_M_C(p_b_M_C, q_1_M_1, M: int):
    return torch.sum(-torch.log(p_b_M_C) * p_b_M_C / q_1_M_1, dim=(1, 2)) / M
