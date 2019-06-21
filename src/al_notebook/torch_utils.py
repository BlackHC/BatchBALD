import numpy as np
import torch
import gc

from IPython.core.magic import needs_local_scope, register_line_magic


def print_cuda_info():
    print(
        f"Allocated: {torch.cuda.memory_allocated() / 2 ** 30:.1f}GB, Cached: {torch.cuda.memory_cached() / 2 ** 30:.1f}GB"
    )


def gc_cuda(quiet=False):
    quiet or print_cuda_info()
    quiet or print(gc.collect())
    torch.cuda.empty_cache()
    quiet or print_cuda_info()


@register_line_magic
@needs_local_scope
def print_global_torch_tensors(line, local_ns):
    def p(device, shape, size_MB, name):
        print(f"{device!s:10s} {size_MB!s:>10s} {shape!s:>20s} {name:<}")

    p("Device", "Shape", "Size", "Name")

    for g, v in local_ns.items():
        # if type(eval(g)).__name__ in types_to_exclude:
        #     continue
        #
        # v = eval(g)
        if not isinstance(v, torch.Tensor):
            continue

        size_MB = np.prod(v.shape) * v.storage().element_size() // 2 ** 20
        p(v.device, tuple(v.shape), f"{size_MB} MB", g)
