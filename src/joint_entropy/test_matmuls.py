"""
------------------------------------------------------------------------------------------------------- benchmark: 5 tests ------------------------------------------------------------------------------------------------------
Name (time in ms)                                       Min                    Max                   Mean             StdDev                 Median                IQR            Outliers      OPS            Rounds  Iterations
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
test_looped_matmul[B100-K100-M10000-CUDA]           19.5622 (1.0)          21.0035 (1.0)          19.7579 (1.0)       0.3821 (1.0)          19.5820 (1.0)       0.0918 (1.0)          8;11  50.6126 (1.0)          49           1
test_batch_matmul[B100-K100-M10000-CUDA]            37.5309 (1.92)         44.7606 (2.13)         38.7910 (1.96)      2.0228 (5.29)         37.7049 (1.93)      1.1935 (13.00)         5;5  25.7792 (0.51)         22           1
test_looped_matmul[B100-K1000-M10000-CUDA]         451.8942 (23.10)       478.7474 (22.79)       457.9076 (23.18)    11.6672 (30.54)       453.2610 (23.15)     7.5546 (82.31)         1;1   2.1838 (0.04)          5           1
test_looped_matmul[B3000-K100-M10000-CUDA]         593.8664 (30.36)       612.7546 (29.17)       599.1632 (30.33)     7.6937 (20.14)       596.6513 (30.47)     5.7624 (62.78)         1;1   1.6690 (0.03)          5           1
test_looped_matmul[B3000-K1000-M10000-CUDA]     13,666.2279 (698.60)   13,813.9576 (657.70)   13,743.9245 (695.62)   57.5436 (150.61)   13,729.5667 (701.13)   82.6156 (900.15)        2;0   0.0728 (0.00)          5           1
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------ benchmark: 6 tests ------------------------------------------------------------------------------------------------------
Name (time in ms)                                      Min                    Max                   Mean             StdDev                 Median                IQR            Outliers      OPS            Rounds  Iterations
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
test_looped_matmul[B100-K100-M10000-CPU]           20.7396 (1.0)          24.3393 (1.0)          21.3850 (1.0)       0.9534 (1.0)          21.1353 (1.0)       0.5201 (1.0)           2;2  46.7618 (1.0)          20           1
test_batch_matmul[B100-K100-M10000-CPU]           311.3701 (15.01)       315.8077 (12.98)       313.8828 (14.68)     1.6859 (1.77)        314.3414 (14.87)     2.2376 (4.30)          2;0   3.1859 (0.07)          5           1
test_looped_matmul[B100-K1000-M10000-CPU]         363.1802 (17.51)       371.0239 (15.24)       365.8506 (17.11)     3.1941 (3.35)        365.3033 (17.28)     4.2612 (8.19)          1;0   2.7334 (0.06)          5           1
test_looped_matmul[B3000-K100-M10000-CPU]         629.2378 (30.34)       672.7529 (27.64)       642.3944 (30.04)    17.8472 (18.72)       634.4882 (30.02)    19.9809 (38.41)         1;0   1.5567 (0.03)          5           1
test_batch_matmul[B100-K1000-M10000-CPU]        3,090.6354 (149.02)    3,153.0030 (129.54)    3,117.8760 (145.80)   22.9118 (24.03)     3,112.5909 (147.27)   25.7942 (49.59)         2;0   0.3207 (0.01)          5           1
test_looped_matmul[B3000-K1000-M10000-CPU]     10,889.9629 (525.08)   10,913.5736 (448.39)   10,901.0825 (509.75)    8.7440 (9.17)     10,902.0372 (515.82)   10.9381 (21.03)         2;0   0.0917 (0.00)          5           1
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
"""
import pytest
import pytest_benchmark
import torch

import torch_utils

# @pytest.fixture(params=[False, True], ids=["CPU", "CUDA"])
@pytest.fixture(params=[False], ids=["CPU"])
def torch_device(request):
    use_cuda = request.param
    if use_cuda:
        assert torch.cuda.is_available()
        torch_utils.gc_cuda()
        return torch.device("cuda")
    return torch.device("cpu")


@pytest.fixture(name="C")
def C():
    return 10


@pytest.fixture(params=[100, 3000], name="B", ids=["B100", "B3000"])
def B(request):
    return request.param


@pytest.fixture(params=[10000], name="M", ids=["M10000"])
def M(request):
    return request.param


@pytest.fixture(params=[100, 1000], name="K", ids=["K100", "K1000"])
def K(request):
    return request.param


@pytest.fixture
def samples_M_K(M, K, torch_device):
    return torch.ones((M, K), dtype=torch.float64, device=torch_device)


@pytest.fixture
def probs_B_K_C(B, K, C, torch_device):
    return torch.ones((B, K, C), dtype=torch.float64, device=torch_device)


@pytest.fixture
def result_B_M_C(B, M, C, torch_device):
    return torch.empty((B, M, C), dtype=torch.float64, device=torch_device)


def test_batch_matmul(B, K, M, benchmark, samples_M_K, probs_B_K_C, result_B_M_C):
    benchmark.extra_info["Debug Mode"] = __debug__

    def inner():
        torch.matmul(samples_M_K, probs_B_K_C, out=result_B_M_C)

        torch.cuda.synchronize()
        return result_B_M_C.shape

    benchmark(inner)


def test_looped_matmul(B, K, M, benchmark, samples_M_K, probs_B_K_C, result_B_M_C):
    benchmark.extra_info["Debug Mode"] = __debug__

    def inner():
        for b in range(B):
            torch.matmul(samples_M_K, probs_B_K_C[b], out=result_B_M_C[b])

        torch.cuda.synchronize()
        return result_B_M_C.shape

    benchmark(inner)
