import blackhc.notebook
import joint_entropy.exact as exact
import joint_entropy.sampling as sampling

import torch_utils
import itertools
import torch
import numpy as np


# As basic as it gets...
def basic_exact_joint_entropy(logits_N_K_C):
    device = logits_N_K_C.device
    N, K, C = logits_N_K_C.shape
    entropy = torch.zeros(1, dtype=torch.float64, device=device)
    N_K_C = torch.exp(logits_N_K_C.double())
    for index in itertools.product(range(C), repeat=N):
        expanded_index = torch.as_tensor(index, device=device).reshape((-1, 1, 1))
        # N x K x 1
        N_K = torch_utils.gather_expand(N_K_C, dim=2, index=expanded_index)
        # N x K
        reshaped_N_K = N_K.reshape(N, K)
        # K
        joint_prob = torch.prod(reshaped_N_K, dim=0)
        # print(joint_prob.shape)
        joint_prob = torch.mean(joint_prob)
        entropy_bit = -joint_prob * torch.log(joint_prob)

        entropy += entropy_bit

    return entropy


def load_logits():
    logits_np = np.load("./src/joint_entropy/test_logits.npy", allow_pickle=False)
    return torch.as_tensor(logits_np)


logits_B_K_C = load_logits()


def test_exact_joint_entropy():
    probs_B_K_C = torch.exp(logits_B_K_C)

    basic_result = basic_exact_joint_entropy(logits_B_K_C[0:3]).item()
    joint_probs_result = exact.entropy_from_M_K(exact.joint_probs_M_K(probs_B_K_C[0:3])).item()

    prev_joint_probs_M_K = exact.joint_probs_M_K(probs_B_K_C[0:2])
    batch_result = exact.batch(probs_B_K_C[2][None], prev_joint_probs_M_K).item()

    assert np.isclose(basic_result, joint_probs_result)
    assert np.isclose(basic_result, batch_result)


def test_sampling_joint_entropy():
    K = logits_B_K_C.shape[1]
    probs_B_K_C = torch.exp(logits_B_K_C)

    basic_result = basic_exact_joint_entropy(logits_B_K_C[0:3]).item()
    samples_result = sampling.from_M_K(sampling.sample_M_K(probs_B_K_C[0:3], 10000 // K)).item()

    assert np.isclose(basic_result, samples_result, atol=0.05)

    prev_joint_probs_M_K = exact.joint_probs_M_K(probs_B_K_C[0:2])
    exact_batch_results = exact.batch(probs_B_K_C, prev_joint_probs_M_K).numpy()

    samples_M_K = sampling.sample_M_K(probs_B_K_C[0:2], 10000 // K)
    sampling_batch_results = sampling.batch(probs_B_K_C, samples_M_K).numpy()

    assert np.allclose(exact_batch_results, sampling_batch_results, atol=0.05)


def test_unified_sampling_joint_entropy():
    K = logits_B_K_C.shape[1]
    probs_B_K_C = torch.exp(logits_B_K_C)

    basic_result = basic_exact_joint_entropy(logits_B_K_C[0:3]).item()
    samples_result = sampling.from_M_K(sampling.sample_M_K_unified(probs_B_K_C[0:3], 10000 // K)).item()

    assert np.isclose(basic_result, samples_result, atol=0.05)

    prev_joint_probs_M_K = exact.joint_probs_M_K(probs_B_K_C[0:2])
    exact_batch_results = exact.batch(probs_B_K_C, prev_joint_probs_M_K).numpy()

    samples_M_K = sampling.sample_M_K(probs_B_K_C[0:2], 10000 // K)
    sampling_batch_results = sampling.batch(probs_B_K_C, samples_M_K).numpy()

    assert np.allclose(exact_batch_results, sampling_batch_results, atol=0.05)
