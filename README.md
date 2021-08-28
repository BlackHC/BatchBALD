# BatchBALD

**Note:** A more modular re-implementation can be found at https://github.com/BlackHC/batchbald_redux.

---

This is the code drop for our paper 
[BatchBALD: Efficient and Diverse Batch Acquisition for Deep Bayesian Active Learning](https://arxiv.org/abs/1906.08158).

The code comes as is.

See https://github.com/BlackHC/batchbald_redux and https://blackhc.github.io/batchbald_redux/ for a reimplementation.

ElementAI's Baal framework also supports BatchBALD: https://github.com/ElementAI/baal/. 

Please cite us:

```
@misc{kirsch2019batchbald,
    title={BatchBALD: Efficient and Diverse Batch Acquisition for Deep Bayesian Active Learning},
    author={Andreas Kirsch and Joost van Amersfoort and Yarin Gal},
    year={2019},
    eprint={1906.08158},
    archivePrefix={arXiv},
    primaryClass={cs.LG}
}
```

## How to run it

Make sure you install all requirements using

```
conda install pytorch torchvision cudatoolkit=10.0 -c pytorch
pip install -r requirements.txt
```

and you can start an experiment using:

```
python src/run_experiment.py --quickquick --num_inference_samples 10 --available_sample_k 40
```

which starts an experiment on a subset of MNIST with 10 MC dropout samples and acquisition size 40.

Have fun playing around with it!
