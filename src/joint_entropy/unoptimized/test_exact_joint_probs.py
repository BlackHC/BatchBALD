"""
------------------------------------------------------------------------------------------------------------------- benchmark: 30 tests --------------------------------------------------------------------------------------------------------------------
Name (time in us)                                                        Min                    Max                   Mean                StdDev                 Median                   IQR            Outliers          OPS            Rounds  Iterations
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
test_joint_probs[N1-M1000-K10-C10-exact_unoptimized-CUDA]            46.6070 (1.0)         989.2210 (1.14)         49.0411 (1.0)         13.7131 (1.52)         47.9110 (1.0)          0.7490 (1.65)     425;1147  20,391.0680 (1.0)       21360           1
test_joint_probs[N1-M1000-K10-C10-exact-CUDA]                        51.0840 (1.10)        894.6930 (1.03)         53.0291 (1.08)         9.0385 (1.0)          52.2390 (1.09)         0.4530 (1.0)      465;1057  18,857.5831 (0.92)      19405           1
test_joint_probs[N2-M1000-K10-C10-exact_unoptimized-CUDA]            98.5120 (2.11)      1,381.0900 (1.59)        102.5189 (2.09)        34.7037 (3.84)        100.0980 (2.09)         0.6700 (1.48)      128;703   9,754.2985 (0.48)      10126           1
test_joint_probs[N1-M1000-K10-C100-exact_unoptimized-CUDA]           99.0480 (2.13)      1,102.6550 (1.27)        102.1223 (2.08)        18.2565 (2.02)        100.7090 (2.10)         0.9960 (2.20)       93;843   9,792.1805 (0.48)      10075           1
test_joint_probs[N2-M1000-K10-C10-exact-CUDA]                        99.5720 (2.14)      1,332.4460 (1.54)        104.4646 (2.13)        33.1318 (3.67)        101.3360 (2.12)         1.4800 (3.27)      226;775   9,572.6239 (0.47)      10007           1
test_joint_probs[N1-M1000-K10-C100-exact-CUDA]                      102.9030 (2.21)      1,057.4780 (1.22)        106.0807 (2.16)        17.5052 (1.94)        104.7530 (2.19)         0.9842 (2.17)       87;773   9,426.7840 (0.46)       9693           1
test_joint_probs[N1-M1000-K100-C10-exact_unoptimized-CUDA]          105.4480 (2.26)        866.2810 (1.0)         109.0077 (2.22)        21.1336 (2.34)        107.2870 (2.24)         1.0100 (2.23)      111;692   9,173.6611 (0.45)       9458           1
test_joint_probs[N1-M1000-K100-C10-exact-CUDA]                      109.3070 (2.35)      1,208.1320 (1.39)        112.9341 (2.30)        22.4546 (2.48)        111.3000 (2.32)         0.9790 (2.16)       99;691   8,854.7235 (0.43)       9121           1
test_joint_probs[N1-M10000-K10-C10-exact_unoptimized-CUDA]          169.4300 (3.64)      1,236.9720 (1.43)        174.2950 (3.55)        38.2490 (4.23)        171.0860 (3.57)         0.9680 (2.14)       51;622   5,737.3980 (0.28)       5892           1
test_joint_probs[N1-M10000-K10-C10-exact-CUDA]                      173.4150 (3.72)      1,164.5810 (1.34)        177.8561 (3.63)        34.2665 (3.79)        175.0040 (3.65)         1.0450 (2.31)       63;479   5,622.5217 (0.28)       5758           1
test_joint_probs[N2-M1000-K100-C10-exact_unoptimized-CUDA]          516.0480 (11.07)     1,764.4700 (2.04)        527.2533 (10.75)       81.7498 (9.04)        518.7620 (10.83)        1.5507 (3.42)       34;149   1,896.6215 (0.09)       1937           1
test_joint_probs[N2-M1000-K100-C10-exact-CUDA]                      520.1480 (11.16)     1,850.0040 (2.14)        531.2949 (10.83)       81.5778 (9.03)        522.6795 (10.91)        1.6440 (3.63)       32;208   1,882.1940 (0.09)       1922           1
test_joint_probs[N2-M10000-K10-C10-exact_unoptimized-CUDA]          667.8280 (14.33)     1,921.3570 (2.22)        680.4265 (13.87)       93.1505 (10.31)       669.6915 (13.98)        1.2930 (2.85)       29;132   1,469.6664 (0.07)       1498           1
test_joint_probs[N2-M10000-K10-C10-exact-CUDA]                      671.8940 (14.42)     1,932.1320 (2.23)        685.4447 (13.98)       93.3697 (10.33)       673.8910 (14.07)        1.3560 (2.99)       32;142   1,458.9068 (0.07)       1488           1
test_joint_probs[N1-M10000-K10-C100-exact_unoptimized-CUDA]         728.3420 (15.63)     1,945.6570 (2.25)        746.6429 (15.22)       85.5047 (9.46)        734.7965 (15.34)        7.3455 (16.22)      29;115   1,339.3283 (0.07)       1372           1
test_joint_probs[N1-M1000-K100-C100-exact_unoptimized-CUDA]         731.1290 (15.69)     1,706.5400 (1.97)        747.2073 (15.24)       66.6289 (7.37)        736.9675 (15.38)        6.7460 (14.89)      33;168   1,338.3166 (0.07)       1368           1
test_joint_probs[N1-M10000-K10-C100-exact-CUDA]                     732.8690 (15.72)     1,892.3050 (2.18)        750.6904 (15.31)       82.2517 (9.10)        738.9830 (15.42)        7.3065 (16.13)      31;109   1,332.1070 (0.07)       1365           1
test_joint_probs[N1-M1000-K100-C100-exact-CUDA]                     734.9730 (15.77)     1,681.1700 (1.94)        750.8568 (15.31)       64.9029 (7.18)        741.1290 (15.47)        7.2173 (15.93)      30;153   1,331.8118 (0.07)       1361           1
test_joint_probs[N1-M10000-K100-C10-exact_unoptimized-CUDA]         888.6050 (19.07)     2,198.1480 (2.54)        913.0516 (18.62)      104.6651 (11.58)       898.3500 (18.75)        7.3485 (16.22)       26;85   1,095.2284 (0.05)       1124           1
test_joint_probs[N1-M10000-K100-C10-exact-CUDA]                     893.5770 (19.17)     2,148.8460 (2.48)        916.5336 (18.69)       99.2067 (10.98)       902.4110 (18.84)        7.0745 (15.62)       27;83   1,091.0675 (0.05)       1120           1
test_joint_probs[N2-M10000-K100-C10-exact_unoptimized-CUDA]       5,746.1260 (123.29)    7,369.6250 (8.51)      5,851.8448 (119.33)     297.0582 (32.87)     5,757.7270 (120.18)       9.1557 (20.21)       12;32     170.8863 (0.01)        175           1
test_joint_probs[N2-M10000-K100-C10-exact-CUDA]                   5,748.1520 (123.33)    7,439.2360 (8.59)      5,863.4752 (119.56)     312.3656 (34.56)     5,760.1740 (120.23)      11.5560 (25.51)       13;33     170.5473 (0.01)        174           1
test_joint_probs[N2-M1000-K10-C100-exact_unoptimized-CUDA]        6,571.2820 (140.99)    8,619.7700 (9.95)      6,697.0275 (136.56)     376.9728 (41.71)     6,576.7790 (137.27)       4.7105 (10.40)       11;31     149.3200 (0.01)        153           1
test_joint_probs[N2-M1000-K10-C100-exact-CUDA]                    6,575.6030 (141.09)    8,763.2820 (10.12)     6,700.6581 (136.63)     359.6752 (39.79)     6,581.1820 (137.36)      11.8020 (26.05)       10;32     149.2391 (0.01)        153           1
test_joint_probs[N1-M10000-K100-C100-exact_unoptimized-CUDA]      6,993.4140 (150.05)    8,810.4520 (10.17)     7,161.6801 (146.03)     357.8868 (39.60)     7,036.4520 (146.87)      48.9850 (108.13)      13;28     139.6320 (0.01)        143           1
test_joint_probs[N1-M10000-K100-C100-exact-CUDA]                  7,015.4520 (150.52)    8,810.1020 (10.17)     7,159.6460 (145.99)     314.0089 (34.74)     7,060.1960 (147.36)      40.3087 (88.98)       12;27     139.6717 (0.01)        143           1
test_joint_probs[N2-M10000-K10-C100-exact-CUDA]                  65,735.0830 (>1000.0)  68,251.9930 (78.79)    66,861.6326 (>1000.0)  1,034.5109 (114.46)   67,077.5095 (>1000.0)  2,132.6410 (>1000.0)      10;0      14.9563 (0.00)         16           1
test_joint_probs[N2-M10000-K10-C100-exact_unoptimized-CUDA]      65,744.1510 (>1000.0)  68,296.9390 (78.84)    67,021.1117 (>1000.0)    846.4743 (93.65)    67,102.1995 (>1000.0)  1,480.7055 (>1000.0)       8;0      14.9207 (0.00)         16           1
test_joint_probs[N2-M1000-K100-C100-exact-CUDA]                  66,196.5920 (>1000.0)  68,942.8860 (79.58)    67,303.9164 (>1000.0)    911.8522 (100.89)   67,375.0770 (>1000.0)  1,780.5885 (>1000.0)       8;0      14.8580 (0.00)         16           1
test_joint_probs[N2-M1000-K100-C100-exact_unoptimized-CUDA]      67,048.9430 (>1000.0)  69,497.4900 (80.23)    68,280.7903 (>1000.0)  1,157.9857 (128.12)   69,101.9220 (>1000.0)  2,322.0807 (>1000.0)      10;0      14.6454 (0.00)         15           1
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

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


@pytest.fixture(params=[1, 2], name="N", ids=["N1", "N2"])
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
def test_joint_probs(N, M, K, C, benchmark, probs_N_K_C, samples_M_K, exact_module: exact):
    benchmark.extra_info["Debug Mode"] = __debug__

    def inner():
        result = exact_module.joint_probs_M_K(probs_N_K_C, samples_M_K)

        torch.cuda.synchronize()
        return result.shape

    with torch.no_grad():
        benchmark(inner)
