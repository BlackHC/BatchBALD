from torch.nn import Module
import torch
import threading

DROPOUT_PROB = 0.5


def set_dropout_p(bayesian_net: Module, p):
    def update_k(module: Module):
        if isinstance(module, _MCDropout):
            module.p = p

    bayesian_net.apply(update_k)


class BayesianModule(Module):
    """A module that we can sample multiple times from given a single input batch.

    To be efficient, the module allows for a part of the forward pass to be deterministic.
    """

    k = None

    def __init__(self, num_classes: int):
        super().__init__()

        # TODO: use a different class for this!
        self.num_classes: int = num_classes

    # Returns B x n x output
    def forward(self, input_B: torch.Tensor, k: int):
        BayesianModule.k = k

        input_B = self.deterministic_forward_impl(input_B)
        mc_input_BK = BayesianModule.mc_tensor(input_B, k)
        mc_output_BK = self.mc_forward_impl(mc_input_BK)
        mc_output_B_K = BayesianModule.unflatten_tensor(mc_output_BK, k)
        return mc_output_B_K

    def deterministic_forward_impl(self, input: torch.Tensor):
        return input

    def mc_forward_impl(self, mc_input_BK: torch.Tensor):
        return mc_input_BK

    def set_dropout_p(self, p):
        def update_k(module: Module):
            if isinstance(module, _MCDropout):
                module.p = p

        self.apply(update_k)

    @staticmethod
    def unflatten_tensor(input: torch.Tensor, k: int):
        input = input.view([-1, k] + list(input.shape[1:]))
        return input

    @staticmethod
    def flatten_tensor(mc_input: torch.Tensor):
        return mc_input.flatten(0, 1)

    @staticmethod
    def mc_tensor(input: torch.tensor, k: int):
        mc_shape = [input.shape[0], k] + list(input.shape[1:])
        return input.unsqueeze(1).expand(mc_shape).flatten(0, 1)


class _MCDropout(Module):
    __constants__ = ["p"]

    def __init__(self):
        super().__init__()
        self.k = None

        p = DROPOUT_PROB

        if p < 0 or p > 1:
            raise ValueError("dropout probability has to be between 0 and 1, " "but got {}".format(p))
        self.p = p
        self.mask = None

    def extra_repr(self):
        return "p={}".format(self.p)

    def reset_mask(self):
        self.mask = None

    def train(self, mode=True):
        super().train(mode)
        if not mode:
            self.reset_mask()

    def _get_sample_mask_shape(self, sample_shape):
        return sample_shape

    def _create_mask(self, input, k):
        mask_shape = [1, k] + list(self._get_sample_mask_shape(input.shape[1:]))
        mask = torch.empty(mask_shape, dtype=torch.uint8, device=input.device).bernoulli_(self.p)
        return mask

    def forward(self, input: torch.Tensor):
        if self.p == 0.0:
            return input

        k = BayesianModule.k
        if self.training:
            # Create a new mask on each call and for each batch element.
            k = input.shape[0]
            mask = self._create_mask(input, k)
        else:
            if self.mask is None:
                # print('recreating mask', self)
                # Recreate mask.
                self.mask = self._create_mask(input, k)

            mask = self.mask

        mc_input = BayesianModule.unflatten_tensor(input, k)
        mc_output = mc_input.masked_fill(mask, 0) / (1 - self.p)

        # Flatten MCDI, batch into one dimension again.
        return BayesianModule.flatten_tensor(mc_output)


class MCDropout(_MCDropout):
    r"""Randomly zeroes some of the elements of the input
    tensor with probability :attr:`p` using samples from a Bernoulli
    distribution. The elements to zero are randomized on every forward call during training time.

    During eval time, a fixed mask is picked and kept until `reset_mask()` is called.

    This has proven to be an effective technique for regularization and
    preventing the co-adaptation of neurons as described in the paper
    `Improving neural networks by preventing co-adaptation of feature
    detectors`_ .

    Furthermore, the outputs are scaled by a factor of :math:`\frac{1}{1-p}` during
    training. This means that during evaluation the module simply computes an
    identity function.

    Args:
        p: probability of an element to be zeroed. Default: 0.5
        inplace: If set to ``True``, will do this operation in-place. Default: ``False``

    Shape:
        - Input: `Any`. Input can be of any shape
        - Output: `Same`. Output is of the same shape as input

    Examples::

        >>> m = nn.Dropout(p=0.2)
        >>> input = torch.randn(20, 16)
        >>> output = m(input)

    .. _Improving neural networks by preventing co-adaptation of feature
        detectors: https://arxiv.org/abs/1207.0580
    """
    pass


class MCDropout2d(_MCDropout):
    r"""Randomly zeroes whole channels of the input tensor.
    The channels to zero-out are randomized on every forward call.

    During eval time, a fixed mask is picked and kept until `reset_mask()` is called.

    Usually the input comes from :class:`nn.Conv2d` modules.

    As described in the paper
    `Efficient Object Localization Using Convolutional Networks`_ ,
    if adjacent pixels within feature maps are strongly correlated
    (as is normally the case in early convolution layers) then i.i.d. dropout
    will not regularize the activations and will otherwise just result
    in an effective learning rate decrease.

    In this case, :func:`nn.Dropout2d` will help promote independence between
    feature maps and should be used instead.

    Args:
        p (float, optional): probability of an element to be zero-ed.
        inplace (bool, optional): If set to ``True``, will do this operation
            in-place

    Shape:
        - Input: :math:`(N, C, H, W)`
        - Output: :math:`(N, C, H, W)` (same shape as input)

    Examples::

        >>> m = nn.Dropout2d(p=0.2)
        >>> input = torch.randn(20, 16, 32, 32)
        >>> output = m(input)

    .. _Efficient Object Localization Using Convolutional Networks:
       http://arxiv.org/abs/1411.4280
    """

    def _get_sample_mask_shape(self, sample_shape):
        return [sample_shape[0]] + [1] * (len(sample_shape) - 1)
