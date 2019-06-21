from torch import nn as nn, Tensor
from torch.nn import functional as F

# from torchvision import models

import mc_dropout


class BayesianNet(mc_dropout.BayesianModule):
    def __init__(self, num_classes):
        super().__init__(num_classes)

        self.num_classes = num_classes
        self.conv1 = nn.Conv2d(1, 32, kernel_size=3)
        self.conv1_drop = mc_dropout.MCDropout2d()
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3)
        self.conv2_drop = mc_dropout.MCDropout2d()
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3)
        self.conv3_drop = mc_dropout.MCDropout2d()
        self.fc1 = nn.Linear(128 * 4 * 4, 512)
        self.fc1_drop = mc_dropout.MCDropout()
        self.fc2 = nn.Linear(512, num_classes)

    def mc_forward_impl(self, input: Tensor):
        input = F.relu(F.max_pool2d(self.conv1_drop(self.conv1(input)), 2))
        input = F.relu(self.conv2_drop(self.conv2(input)))
        input = F.relu(F.max_pool2d(self.conv3_drop(self.conv3(input)), 2))
        input = input.view(-1, 128 * 4 * 4)
        input = F.relu(self.fc1_drop(self.fc1(input)))
        input = self.fc2(input)
        input = F.log_softmax(input, dim=1)
        return input


# class LambdaModule(nn.Module):
#     def __init__(self, func):
#         super().__init__()
#         self.func = func
#
#     def forward(self, *inputs):
#         return self.func(*inputs)
#
#
# class BayesianNet(nn.Module):
#     def __init__(self, num_classes):
#         super().__init__()
#
#         self.resnet = models.resnet18(pretrained=False,
#                                       num_classes=num_classes)
#         # Adapted resnet from:
#         # https://github.com/kuangliu/pytorch-cifar/blob/master/models/resnet.py
#         #LambdaModule(lambda x: x.expand((-1, 64, 28, 28))) #
#         self.resnet.conv1 = nn.Conv2d(1, 64, kernel_size=3, stride=1, padding=1, bias=False)
#         #self.resnet.layer1 = LambdaModule(lambda x: x.repeat((x.shape[0], 128, 28, 28)))
#         self.resnet.maxpool = LambdaModule(lambda x: x)
#
#     def forward(self, mc_input):
#         x, n = mc_dropout.mc_flatten(mc_input)
#         x = self.resnet(x)
#         x = F.log_softmax(x, dim=1)
#
#         return mc_dropout.mc_unflatten_B_K_(x, n)
