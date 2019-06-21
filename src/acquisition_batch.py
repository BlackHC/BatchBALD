import dataclasses
import typing


@dataclasses.dataclass
class AcquisitionBatch:
    indices: typing.List[int]
    scores: typing.List[float]
    orignal_scores: typing.Optional[typing.List[float]]
