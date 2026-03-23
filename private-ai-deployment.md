---
layout: single
title: "Private AI Deployment"
permalink: /private-ai-deployment/
classes: wide
---

Deploy AI in your environment with practical security, compliance, and reliability.

## What you get
- Architecture guidance for private / hybrid deployments
- Evaluation and observability (quality, latency, cost)
- Security posture (data handling, access controls, auditability)
- Integration into real workflows (tools, retrieval, automation)

## Example deployment models
- VPC/VNet private endpoints
- On-prem / edge deployments
- Hybrid (private data + hosted inference)

## The Practical Guide to Running Local LLMs (2026 Edition)

A comprehensive reference for running large language models locally, covering hardware, runtimes, optimization techniques, model choices, and practical setups.

---

## 5-Minute Quick Start (Pick One)

### Option A - Easiest (Ollama)

```bash
brew install ollama
ollama run llama3:8b
```

### Option B - Fast Local (llama.cpp, CPU/GGUF)

```bash
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp && make
./main -m model.gguf -p "Explain local inference"
```

### Option C - API Server (vLLM)

```bash
vllm serve Qwen/Qwen2.5-0.5B-Instruct
```

---

## 1. Why Run LLMs Locally?

- Privacy (no data leaves device)
- Cost control (no per-token fees)
- Low latency / offline
- Full customization (prompts, adapters, infra)

---

## 2. Hardware: The Foundation

### Key Concepts

- VRAM (GPU) -> speed-critical
- RAM (CPU) -> fallback, slower
- Bandwidth -> drives tokens/sec

### Tiers

#### NVIDIA GPU (Best)

- RTX 3060 (12GB), 3090/4090 (24GB), A100/H100
- CUDA ecosystem -> best support
- 7B-70B+ viable

#### Apple Silicon (Mac)

- Unified memory + Metal
- Best with MLX / llama.cpp
- 3B-7B sweet spot

#### CPU-only

- Works everywhere
- <=3B practical

---

## 3. Model Selection (Why Size Matters)

| Size | Use | Notes |
| --- | --- | --- |
| 0.5-1B | tools | fast, limited |
| 3B | assistants | balanced |
| 7-8B | general | sweet spot |
| 13B+ | reasoning | GPU needed |

---

## 4. Inference Engines

- vLLM -> serving, batching, API
- llama.cpp -> portability, GGUF
- MLX -> Apple GPU
- Ollama -> simplicity

---

## 5. Core Techniques

### Quantization

- FP16 -> high quality
- INT8 -> balanced
- INT4 -> local default

### KV Cache

```bash
export VLLM_CPU_KVCACHE_SPACE=4
```

### Batching

- Improves throughput (GPU)

### Offloading

- Spill to CPU/disk when VRAM limited

---

## 6. Running vLLM on macOS (CPU)

```bash
xcode-select --install
brew install uv git cmake ninja

uv venv --python 3.12
source .venv/bin/activate

git clone https://github.com/vllm-project/vllm.git
cd vllm

uv pip install -r requirements/cpu-build.txt
uv pip install -r requirements/cpu.txt

VLLM_TARGET_DEVICE=cpu uv pip install .

vllm serve Qwen/Qwen2.5-0.5B-Instruct
```

---

## 7. System Architectures

### Basic

`App -> Runtime -> Model`

### API Server

`Client -> vLLM -> Model`

### RAG

`User -> Retriever -> Context -> LLM -> Answer`

### Hybrid

`Local LLM + Cloud fallback`

---

## 8. Benchmarks (Rules of Thumb)

| Hardware | Model | Tokens/sec |
| --- | --- | --- |
| CPU | 3B INT4 | 2-8 |
| M2/M3 | 7B | 20-60 |
| RTX 4090 | 7B | 120-250 |

---

## 9. VRAM Guide

| Model | FP16 | INT4 |
| --- | --- | --- |
| 7B | ~14GB | ~4GB |
| 13B | ~26GB | ~8GB |

---

## 10. RAG Example

```python
q = "policy?"
ctx = vectordb.search(embed(q))
prompt = f"{ctx}\nQ:{q}"
resp = llm(prompt)
```

---

## 11. Runtime Comparison

| Tool | Strength |
| --- | --- |
| vLLM | serving |
| TensorRT-LLM | max NVIDIA perf |
| TGI | HF ecosystem |
| llama.cpp | local |

---

## 12. Cost

- Cloud -> flexible, ongoing cost
- Local -> upfront, free usage

---

## 13. Build Recipes

- Mac -> MLX / llama.cpp + 7B INT4
- Budget GPU -> 3060 + 7B-13B
- High-end -> 4090 + 13B-70B

---

## 14. Advanced Optimization

- Speculative decoding
- Flash attention
- Tensor/pipeline parallelism
- LoRA adapters

---

## 15. Model Recommendations by Task

### Coding

- DeepSeek-Coder-6.7B
- CodeLlama-7B

### Chat

- LLaMA-3-8B
- Mistral-7B

### RAG

- Mistral-7B
- LLaMA-3-8B

### Reasoning

- Qwen2.5-14B

### Lightweight

- Qwen 0.5B
- Phi-3-mini

---

## 16. Exact Model Picks

Use:

- GGUF (CPU/Mac)
- HF FP16 (GPU/vLLM)

Examples:

- `meta-llama/Meta-Llama-3-8B-Instruct`
- `mistralai/Mistral-7B-Instruct-v0.2`
- `Qwen/Qwen2.5-7B-Instruct`

---

## 17. Prompt Templates

### LLaMA 3

```text
<|begin_of_text|>
<|start_header_id|>user<|end_header_id|>
{prompt}
<|eot_id|>
<|start_header_id|>assistant<|end_header_id|>
```

### Mistral

```text
<s>[INST] {prompt} [/INST]
```

### Generic

```text
User: {prompt}
Assistant:
```

---

## 18. Hugging Face References

- `meta-llama/Meta-Llama-3-8B-Instruct`
- `mistralai/Mistral-7B-Instruct-v0.2`
- `Qwen/Qwen2.5-7B-Instruct`
- `deepseek-ai/deepseek-coder-6.7b-instruct`

---

## 19. Common Mistakes I Fix for Clients

These are the most frequent, and expensive, mistakes teams make when implementing local LLMs:

1. Choosing the Wrong Model Size
- Running large models (13B+) on CPU -> unusable latency
- Using tiny models for complex reasoning tasks

2. Ignoring Quantization Strategy
- Using FP16 everywhere without considering memory
- Not leveraging INT4/INT8 effectively

3. Poor Memory and KV Cache Management
- Default configs causing crashes
- No tuning for context length

4. Using the Wrong Runtime
- vLLM on Mac CPU expecting performance
- llama.cpp used for production APIs

5. Weak Prompting
- Not using model-specific templates
- Inconsistent outputs and hallucinations

6. Broken RAG Pipelines
- Too much context
- No chunking strategy
- Weak embeddings

7. Ignoring Throughput vs Latency
- Optimizing for single request instead of system performance

8. Overengineering Early
- Jumping into multi-GPU / agents without baseline

9. Misunderstanding Hardware Limits
- Confusing RAM with VRAM
- Ignoring bandwidth constraints

10. No Evaluation Framework
- No benchmarks or test cases
- No way to measure improvements

### Why This Matters

Most issues are not due to the model itself, but misalignment between:

- hardware
- model
- runtime
- workload

Avoiding these mistakes dramatically reduces time-to-production and cost.

---

## 20. Applying This in the Real World

At this point, you can likely get a local LLM running. The harder part, and where most teams struggle, is:

- Choosing the right model for their specific use case
- Optimizing performance (latency, memory, throughput)
- Designing reliable pipelines (RAG, agents, APIs)
- Avoiding costly trial-and-error across tools and hardware

In practice, most production-grade setups involve careful tradeoffs between cost, performance, and reliability, not just "running a model locally."

This is where working with someone experienced in:

- local inference stacks (vLLM, llama.cpp, MLX)
- model selection and evaluation
- RAG system design
- performance tuning on real hardware

can significantly reduce time-to-production.

If you're building:

- internal AI tools
- private or on-device LLM systems
- cost-efficient alternatives to API usage

then a tailored setup often performs far better than generic, off-the-shelf configurations.

---

## 21. Final Takeaways

- Hardware defines limits
- 7B-8B models are the sweet spot
- Quantization enables local inference
- vLLM = serving, llama.cpp = local
- NVIDIA dominates, Mac is viable
- Hybrid setups are the practical default

---

## Work With Me

If you're building with local LLMs and want to avoid the common pitfalls outlined above, whether it's choosing the right model, optimizing performance, or designing a production-ready system, I can help you get there faster.

Reach out if you're working on:

- Private or on-device AI systems
- Cost-efficient alternatives to API usage
- RAG pipelines or internal AI tools

A well-designed setup can save weeks of iteration and significantly reduce infrastructure cost.

## Contact
Email: <a href="mailto:{{ site.contact_email }}">{{ site.contact_email }}</a>
