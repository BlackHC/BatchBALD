"""
------------------------------------------------------------------------------------------------------- benchmark: 16 tests --------------------------------------------------------------------------------------------------------
Name (time in ms)                                                    Min                 Max                Mean            StdDev              Median               IQR            Outliers       OPS            Rounds  Iterations
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
test_batch[B100-M1000-K10-C10-sampling-CUDA]                      1.1078 (1.0)        1.8505 (1.0)        1.1457 (1.0)      0.0738 (1.0)        1.1302 (1.0)      0.0088 (1.56)       20;152  872.8331 (1.0)         904           1
test_batch[B100-M1000-K10-C10-sampling_unoptimized-CUDA]          1.2252 (1.11)       2.0299 (1.10)       1.2640 (1.10)     0.0857 (1.16)       1.2451 (1.10)     0.0083 (1.47)       29;153  791.1487 (0.91)        825           1
test_batch[B100-M1000-K100-C10-sampling-CUDA]                     2.0047 (1.81)       3.3406 (1.81)       2.5378 (2.22)     0.1121 (1.52)       2.5180 (2.23)     0.0056 (1.0)         29;61  394.0453 (0.45)        500           1
test_batch[B100-M1000-K100-C10-sampling_unoptimized-CUDA]         2.1156 (1.91)       3.4055 (1.84)       2.6492 (2.31)     0.1123 (1.52)       2.6327 (2.33)     0.0074 (1.31)        33;50  377.4653 (0.43)        474           1
test_batch[B100-M1000-K10-C100-sampling-CUDA]                     4.6690 (4.21)       5.9210 (3.20)       4.7674 (4.16)     0.1578 (2.14)       4.7214 (4.18)     0.0156 (2.77)        19;31  209.7563 (0.24)        216           1
test_batch[B100-M1000-K10-C100-sampling_unoptimized-CUDA]         5.7400 (5.18)       6.7860 (3.67)       5.8217 (5.08)     0.1591 (2.16)       5.7671 (5.10)     0.0214 (3.82)        20;32  171.7706 (0.20)        175           1
test_batch[B100-M10000-K10-C10-sampling-CUDA]                     6.1908 (5.59)       7.5333 (4.07)       6.2877 (5.49)     0.2412 (3.27)       6.2084 (5.49)     0.0171 (3.05)        13;29  159.0417 (0.18)        162           1
test_batch[B100-M10000-K10-C10-sampling_unoptimized-CUDA]         7.2321 (6.53)       8.6068 (4.65)       7.3444 (6.41)     0.2603 (3.53)       7.2547 (6.42)     0.0198 (3.52)        10;27  136.1573 (0.16)        139           1
test_batch[B100-M1000-K100-C100-sampling-CUDA]                   12.6860 (11.45)     14.0044 (7.57)      12.8344 (11.20)    0.2899 (3.93)      12.7036 (11.24)    0.0990 (17.61)        9;13   77.9155 (0.09)         79           1
test_batch[B100-M1000-K100-C100-sampling_unoptimized-CUDA]       13.7252 (12.39)     14.9735 (8.09)      13.8917 (12.13)    0.3132 (4.24)      13.7504 (12.17)    0.0391 (6.96)        10;17   71.9853 (0.08)         73           1
test_batch[B100-M10000-K100-C10-sampling-CUDA]                   22.5565 (20.36)     24.5750 (13.28)     22.9606 (20.04)    0.6134 (8.31)      22.6030 (20.00)    0.6066 (107.95)        9;5   43.5529 (0.05)         45           1
test_batch[B100-M10000-K100-C10-sampling_unoptimized-CUDA]       23.5950 (21.30)     25.8900 (13.99)     24.0065 (20.95)    0.6956 (9.43)      23.6343 (20.91)    0.3800 (67.63)         7;8   41.6553 (0.05)         43           1
test_batch[B100-M10000-K10-C100-sampling-CUDA]                   41.9079 (37.83)     44.0085 (23.78)     42.5781 (37.16)    0.7889 (10.69)     42.0594 (37.21)    1.4129 (251.44)        6;0   23.4863 (0.03)         24           1
test_batch[B100-M10000-K10-C100-sampling_unoptimized-CUDA]       52.2032 (47.12)     54.1277 (29.25)     53.0631 (46.32)    0.7012 (9.50)      53.2432 (47.11)    1.4065 (250.30)       10;0   18.8455 (0.02)         20           1
test_batch[B100-M10000-K100-C100-sampling-CUDA]                 101.1607 (91.32)    104.4871 (56.46)    103.1502 (90.03)    1.0825 (14.67)    103.4049 (91.49)    0.5484 (97.59)         4;4    9.6946 (0.01)         10           1
test_batch[B100-M10000-K100-C100-sampling_unoptimized-CUDA]     111.7075 (100.84)   114.8075 (62.04)    113.3305 (98.92)    1.0230 (13.86)    113.6318 (100.54)   1.0346 (184.12)        3;0    8.8237 (0.01)          9           1
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Legend:
  Outliers: 1 Standard Deviation from Mean; 1.5 IQR (InterQuartile Range) from 1st Quartile and 3rd Quartile.
  OPS: Operations Per Second, computed as 1 / Mean


-------------------------------------------------------------------------------------------------------- benchmark: 12 tests --------------------------------------------------------------------------------------------------------
Name (time in ms)                                                    Min                 Max                Mean             StdDev              Median                IQR            Outliers      OPS            Rounds  Iterations
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
test_batch[B3000-M1000-K10-C10-sampling-CUDA]                    32.3832 (1.0)       33.0525 (1.0)       32.7179 (1.0)       0.1607 (1.0)       32.7036 (1.0)       0.2010 (1.0)           9;0  30.5643 (1.0)          31           1
test_batch[B3000-M1000-K10-C10-sampling_unoptimized-CUDA]        35.2503 (1.09)      36.4002 (1.10)      35.5165 (1.09)      0.2661 (1.66)      35.4550 (1.08)      0.2710 (1.35)          5;2  28.1560 (0.92)         29           1
test_batch[B3000-M1000-K100-C10-sampling-CUDA]                   58.5776 (1.81)      75.2259 (2.28)      73.4052 (2.24)      4.3005 (26.76)     74.5446 (2.28)      1.1596 (5.77)          1;1  13.6230 (0.45)         14           1
test_batch[B3000-M1000-K100-C10-sampling_unoptimized-CUDA]       76.6273 (2.37)      78.2043 (2.37)      77.5847 (2.37)      0.5324 (3.31)      77.7521 (2.38)      0.8034 (4.00)          6;0  12.8891 (0.42)         14           1
test_batch[B3000-M1000-K10-C100-sampling-CUDA]                  139.0792 (4.29)     141.1358 (4.27)     140.2376 (4.29)      0.7066 (4.40)     140.3016 (4.29)      1.0456 (5.20)          3;0   7.1308 (0.23)          8           1
test_batch[B3000-M1000-K10-C100-sampling_unoptimized-CUDA]      167.8615 (5.18)     171.4414 (5.19)     170.1627 (5.20)      1.2720 (7.92)     170.3474 (5.21)      1.1053 (5.50)          2;1   5.8767 (0.19)          6           1
test_batch[B3000-M10000-K10-C10-sampling-CUDA]                  184.5110 (5.70)     186.0289 (5.63)     185.1936 (5.66)      0.6105 (3.80)     185.0222 (5.66)      1.0683 (5.32)          3;0   5.3998 (0.18)          6           1
test_batch[B3000-M10000-K10-C10-sampling_unoptimized-CUDA]      213.1244 (6.58)     216.0384 (6.54)     214.4193 (6.55)      1.0850 (6.75)     214.0865 (6.55)      1.3093 (6.52)          2;0   4.6638 (0.15)          5           1
test_batch[B3000-M1000-K100-C100-sampling-CUDA]                 381.1239 (11.77)    382.1267 (11.56)    381.7935 (11.67)     0.4026 (2.51)     381.9754 (11.68)     0.4730 (2.35)          1;0   2.6192 (0.09)          5           1
test_batch[B3000-M1000-K100-C100-sampling_unoptimized-CUDA]     410.5220 (12.68)    411.4704 (12.45)    410.8489 (12.56)     0.4487 (2.79)     410.5450 (12.55)     0.7342 (3.65)          1;0   2.4340 (0.08)          5           1
test_batch[B3000-M10000-K100-C10-sampling-CUDA]                 691.1265 (21.34)    695.8697 (21.05)    694.0313 (21.21)     1.7912 (11.15)    694.1059 (21.22)     1.9497 (9.70)          2;0   1.4409 (0.05)          5           1
test_batch[B3000-M10000-K100-C10-sampling_unoptimized-CUDA]     716.3138 (22.12)    765.3272 (23.15)    728.1879 (22.26)    20.9446 (130.33)   719.6049 (22.00)    17.1789 (85.48)         1;1   1.3733 (0.04)          5           1
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

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


@pytest.fixture(params=[100, 3000], name="B", ids=["B100", "B3000"])
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


@pytest.fixture(params=[exact, exact_unoptimized], name="module_exact", ids=["exact", "exact_unoptimized"])
def exact_module(request) -> exact:
    return request.param


@pytest.fixture(
    params=[sampling, sampling_unoptimized], name="sampling_module", ids=["sampling", "sampling_unoptimized"]
)
def sampling_module(request) -> sampling:
    return request.param


@pytest.mark.benchmark(warmup=True)
def test_batch(B, M, K, C, benchmark, probs_B_K_C, samples_M_K, sampling_module: sampling):
    benchmark.extra_info["Debug Mode"] = __debug__

    def inner():
        result = sampling_module.batch(probs_B_K_C, samples_M_K)

        torch.cuda.synchronize()
        return result.shape

    benchmark(inner)
