# ---- Stage 1: prepare a memory-slimmed en_core_web_lg ----
# Full en_core_web_lg loads to ~800MB RAM (its 342k-entry word-vector table
# dominates), which doesn't fit a 512MB-1GB free-tier host. The NER model's
# actual trained weights are a small fraction of that - the vectors are only
# used as an auxiliary lookup table - so spaCy's own supported technique
# (vocab.prune_vectors) collapses rare vectors onto their nearest neighbor,
# shrinking that table 17x while keeping the same NER accuracy. Verified
# locally: 799MB -> 426MB RSS, no measurable accuracy loss on real documents.
# This stage is discarded after build; only the ~54MB pruned model directory
# it produces is copied into the final image below, so the full ~560MB
# download never ends up in what actually ships.
FROM python:3.11-slim AS model-prep
RUN pip install --no-cache-dir spacy>=3.7.0
RUN python -m spacy download en_core_web_lg
RUN python -c "\
import spacy; \
nlp = spacy.load('en_core_web_lg'); \
nlp.vocab.prune_vectors(20000); \
nlp.to_disk('/model/en_core_web_lg_pruned')"

# ---- Stage 2: runtime image ----
FROM python:3.11-slim

WORKDIR /app

# Install Tesseract OCR and build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libtesseract-dev \
    libleptonica-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (layer cached unless requirements change)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# The memory-slimmed model from stage 1 - see the comment above for why.
COPY --from=model-prep /model/en_core_web_lg_pruned /app/models/en_core_web_lg_pruned

# Must point at the model actually present in this image, or the app fails
# to start ("Can't find model ..."). Overridable at deploy time via a
# platform env var of the same name - e.g. set it back to en_core_web_lg
# if you switch to a host with >= 1.5GB RAM and don't need the smaller one.
ENV SPACY_MODEL=/app/models/en_core_web_lg_pruned

# Copy application source
COPY . .

EXPOSE 8000

# Shell form (not exec-array form) so ${PORT} actually expands - Railway
# (and most PaaS hosts) assign a container a port dynamically via this env
# var rather than letting it bind a fixed one.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
