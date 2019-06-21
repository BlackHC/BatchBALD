"""
------------------------------------------------------------------------------------------------------------------ benchmark: 16 tests ------------------------------------------------------------------------------------------------------------------
Name (time in us)                                                     Min                     Max                    Mean              StdDev                  Median                   IQR            Outliers         OPS            Rounds  Iterations
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
test_batch[B100-M1000-K10-C10-exact-CUDA]                        865.6400 (1.0)        1,717.3570 (1.0)          901.1227 (1.0)       38.7317 (1.0)          893.2325 (1.0)          9.5730 (1.16)       76;223  1,109.7268 (1.0)        1134           1
test_batch[B100-M1000-K10-C10-exact_unoptimized-CUDA]          1,150.8060 (1.33)       1,984.8380 (1.16)       1,179.1650 (1.31)      53.8347 (1.39)       1,168.4160 (1.31)        14.4927 (1.76)        31;95    848.0578 (0.76)        869           1
test_batch[B100-M1000-K100-C10-exact-CUDA]                     1,913.4620 (2.21)       3,506.8230 (2.04)       2,450.0072 (2.72)     123.8626 (3.20)       2,430.8180 (2.72)         8.2408 (1.00)        33;48    408.1621 (0.37)        523           1
test_batch[B100-M1000-K100-C10-exact_unoptimized-CUDA]         2,021.1430 (2.33)       3,596.4000 (2.09)       2,554.5107 (2.83)     124.8774 (3.22)       2,533.9400 (2.84)         8.2287 (1.0)         34;43    391.4644 (0.35)        495           1
test_batch[B100-M1000-K10-C100-exact-CUDA]                     3,883.7520 (4.49)       4,981.1490 (2.90)       3,958.0390 (4.39)     134.7376 (3.48)       3,930.7360 (4.40)        13.1315 (1.60)        12;27    252.6504 (0.23)        256           1
test_batch[B100-M1000-K10-C100-exact_unoptimized-CUDA]         4,921.2020 (5.69)       6,362.8580 (3.71)       4,991.6407 (5.54)     165.5989 (4.28)       4,945.8965 (5.54)        20.0410 (2.44)        13;25    200.3349 (0.18)        204           1
test_batch[B100-M10000-K10-C10-exact-CUDA]                     5,398.8910 (6.24)       6,626.8890 (3.86)       5,480.4359 (6.08)     210.0493 (5.42)       5,417.6210 (6.07)        13.5290 (1.64)        15;24    182.4672 (0.16)        186           1
test_batch[B100-M10000-K10-C10-exact_unoptimized-CUDA]         6,421.8240 (7.42)       7,860.5560 (4.58)       6,529.6880 (7.25)     254.0985 (6.56)       6,447.1515 (7.22)        22.5415 (2.74)        13;26    153.1467 (0.14)        156           1
test_batch[B100-M1000-K100-C100-exact-CUDA]                   11,891.6630 (13.74)     13,289.6480 (7.74)      12,038.5923 (13.36)    290.2887 (7.49)      11,914.5870 (13.34)       24.1245 (2.93)        13;19     83.0662 (0.07)         85           1
test_batch[B100-M1000-K100-C100-exact_unoptimized-CUDA]       12,914.4790 (14.92)     14,217.3700 (8.28)      13,073.4213 (14.51)    308.4870 (7.96)      12,942.6335 (14.49)       20.7490 (2.52)         9;18     76.4911 (0.07)         78           1
test_batch[B100-M10000-K100-C10-exact-CUDA]                   21,715.1580 (25.09)     23,838.5590 (13.88)     22,093.3122 (24.52)    601.7935 (15.54)     21,776.0390 (24.38)      324.1377 (39.39)         7;9     45.2626 (0.04)         47           1
test_batch[B100-M10000-K100-C10-exact_unoptimized-CUDA]       22,763.6510 (26.30)     24,880.6950 (14.49)     23,156.5051 (25.70)    678.4911 (17.52)     22,799.5700 (25.52)      293.6105 (35.68)         9;9     43.1844 (0.04)         44           1
test_batch[B100-M10000-K10-C100-exact-CUDA]                   33,913.3260 (39.18)     35,900.8090 (20.90)     34,461.9945 (38.24)    697.6191 (18.01)     34,047.4900 (38.12)      973.8570 (118.35)        6;0     29.0175 (0.03)         30           1
test_batch[B100-M10000-K10-C100-exact_unoptimized-CUDA]       44,188.7250 (51.05)     46,499.7800 (27.08)     44,916.4180 (49.84)    827.6286 (21.37)     44,419.5640 (49.73)    1,160.1625 (140.99)        5;0     22.2636 (0.02)         23           1
test_batch[B100-M10000-K100-C100-exact-CUDA]                  93,249.1790 (107.72)    95,717.1960 (55.74)     94,908.2300 (105.32)   873.2188 (22.55)     95,136.4510 (106.51)     728.5440 (88.54)         2;2     10.5365 (0.01)         11           1
test_batch[B100-M10000-K100-C100-exact_unoptimized-CUDA]     103,765.6580 (119.87)   106,715.8440 (62.14)    105,403.4703 (116.97)   897.2707 (23.17)    105,656.1390 (118.29)     632.2080 (76.83)         3;2      9.4874 (0.01)         10           1
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Legend:
  Outliers: 1 Standard Deviation from Mean; 1.5 IQR (InterQuartile Range) from 1st Quartile and 3rd Quartile.
  OPS: Operations Per Second, computed as 1 / Mean
"""
import pytest
import pytest_benchmark
import torch
import joint_entropy.exact as exact
import joint_entropy.sampling as sampling

import joint_entropy.unoptimized.exact as exact_unoptimized
import joint_entropy.unoptimized.sampling as sampling_unoptimized

import torch_utils


# @pytest.fixture(params=[False, True], ids=["CPU", "CUDA"])
@pytest.fixture(params=[True], ids=["CUDA"])
def torch_device(request):
    use_cuda = request.param
    if use_cuda:
        assert torch.cuda.is_available()
        torch_utils.gc_cuda()
        return torch.device("cuda")
    return torch.device("cpu")


@pytest.fixture(params=[10, 100], name="C", ids=["C10", "C100"])
def C(request):
    return request.param


@pytest.fixture(params=[100], name="B", ids=["B100"])
def B(request):
    return request.param


@pytest.fixture(params=[1000, 10000], name="M", ids=["M1000", "M10000"])
def M(request):
    return request.param


@pytest.fixture(params=[10, 100], name="K", ids=["K10", "K100"])
def K(request):
    return request.param


@pytest.fixture(params=[100, 1000], name="S", ids=["S100", "S1000"])
def S(request):
    return request.param


@pytest.fixture(params=[1, 2, 4, 8], name="N", ids=["N1", "N2", "N4", "N8"])
def N(request):
    return request.param


@pytest.fixture
def samples_M_K(M, K, torch_device):
    return torch.ones((M, K), dtype=torch.float64, device=torch_device)


@pytest.fixture
def probs_B_K_C(B, K, C, torch_device):
    return torch.ones((B, K, C), dtype=torch.float64, device=torch_device)


@pytest.fixture
def probs_N_K_C(N, K, C, torch_device):
    return torch.ones((N, K, C), dtype=torch.float64, device=torch_device)


@pytest.fixture
def result_B_M_C(B, M, C, torch_device):
    return torch.empty((B, M, C), dtype=torch.float64, device=torch_device)


@pytest.fixture(params=[exact, exact_unoptimized], name="exact_module", ids=["exact", "exact_unoptimized"])
def exact_module(request) -> exact:
    return request.param


@pytest.fixture(
    params=[sampling, sampling_unoptimized], name="sampling_module", ids=["sampling", "sampling_unoptimized"]
)
def sampling_module(request) -> sampling:
    return request.param


@pytest.mark.benchmark(warmup=True)
def test_batch(B, M, K, C, benchmark, probs_B_K_C, samples_M_K, exact_module: exact):
    benchmark.extra_info["Debug Mode"] = __debug__

    def inner():
        result = exact_module.batch(probs_B_K_C, samples_M_K)

        torch.cuda.synchronize()
        return result.shape

    benchmark(inner)
