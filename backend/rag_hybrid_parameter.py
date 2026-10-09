import os
# rag_medical_qa_hybrid.py

import pandas as pd
import re
import unicodedata
import json
import torch
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from openai import OpenAI

# 1. Load QA corpus
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "Ai_qa_combine.txt"), "r", encoding="utf-8") as f:
    raw_blocks = f.read().split("\n\n")

# 2. Chunk as QA pairs
qa_pairs = []
for block in raw_blocks:
    if block.startswith("Q:") and "A:" in block:
        try:
            q = block.split("Q:")[1].split("A:")[0].strip()
            a = block.split("A:")[1].strip()
            qa_pairs.append({"question": q, "answer": a})
        except:
            continue

# 3. Load embedding model and prepare embeddings
embedder = SentenceTransformer("intfloat/multilingual-e5-base")
questions = [item["question"] for item in qa_pairs]
question_embeddings = embedder.encode(questions, convert_to_tensor=True)

# 4. Build TF-IDF sparse index
vectorizer = TfidfVectorizer().fit(questions)
tfidf_matrix = vectorizer.transform(questions)

# 5. Hybrid retrieval: TF-IDF → Dense rerank
def retrieve_context_hybrid(query, top_k=5, tfidf_top_k=20):
    # Sparse retrieval
    tfidf_query = vectorizer.transform([query])
    sparse_scores = (tfidf_query * tfidf_matrix.T).toarray()[0]
    top_sparse_idx = sparse_scores.argsort()[-tfidf_top_k:][::-1].copy()  # ← Fixed here

    # Dense re-ranking
    query_embedding = embedder.encode(query, convert_to_tensor=True)
    filtered_embeddings = question_embeddings[top_sparse_idx]
    dense_scores = cosine_similarity(
        query_embedding.cpu().reshape(1, -1),
        filtered_embeddings.cpu()
    )[0]
    top_dense_idx = dense_scores.argsort()[-top_k:][::-1]
    
    return "\n".join([qa_pairs[top_sparse_idx[i]]["answer"] for i in top_dense_idx])


# 6. Thai choice extractor
def extract_thai_choices(text):
    if pd.isna(text):
        return ""

    text = unicodedata.normalize("NFKC", str(text))
    text = re.sub(r'[\u200b-\u200d\uFEFF]', '', text)

    patterns = [
        r'\b([กขคง])\.', r'\(([กขคง])\)', r'(?<!\w)([กขคง])(?!\w)',
        r'\b([a-dA-D])\b'
    ]

    for pattern in patterns:
        matches = re.findall(pattern, text)
        if matches:
            if pattern == patterns[-1]:
                en_to_th = {'a': 'ก', 'b': 'ข', 'c': 'ค', 'd': 'ง'}
                matches = [en_to_th[m.lower()] for m in matches if m.lower() in en_to_th]
            return ",".join(sorted(set(matches), key=matches.index))
    return ""

# 7. Load dataset
df = pd.read_csv("documents/test.csv")

# 8. Initialize OpenTyphoon
client = OpenAI(
    api_key=os.environ["TYPHOON_API_KEY"],
    base_url="https://api.opentyphoon.ai/v1"
)

# 9. Ask each question with hybrid retrieved context
answers, responses, contexts = [], [], []

for question in df["question"]:
    context = retrieve_context_hybrid(question)

    messages = [
        {
            "role": "system",
            "content": (
                "คุณเป็นผู้ช่วยแพทย์ชาวไทยที่เชี่ยวชาญด้านสิทธิหลักประกันสุขภาพแห่งชาติ "
                "คุณจะได้รับข้อมูลและคำถามแบบหลายตัวเลือก "
                "เลือกคำตอบที่ถูกต้องที่สุดจากตัวเลือก ก, ข, ค, ง เท่านั้น"
            )
        },
        {
            "role": "user",
            "content": (
                "ข้อมูลอ้างอิง:\n"
                "ใช้ได้ทั่วประเทศ มีผลตั้งแต่วันที่ 1 มกราคม 2565 เป็นต้นไป\n\n"
                "คำถาม:\nนโยบายปฐมภูมิไปที่ไหนก็ได้ ใช้ได้ทั่วประเทศหรือไม่?"
            )
        },
        {
            "role": "assistant",
            "content": "ก"
        },
        {
            "role": "user",
            "content": f"ข้อมูลอ้างอิง:\n{context}\n\nคำถาม:\n{question}"
        }
    ]

    response = client.chat.completions.create(
        model="typhoon-v2.1-12b-instruct",
        messages=messages,
        max_tokens=512,
        temperature=0.4
    )

    reply = response.choices[0].message.content.strip()
    extracted = extract_thai_choices(reply) or "-"

    answers.append(extracted)
    responses.append(reply)
    contexts.append(context)

# 10. Save results
df["retrieved_context"] = contexts
df["model_response"] = responses
df["answer"] = answers
df.to_csv("documents/combine_answer_hybrid_param.csv", index=False)

print("✅ done: Hybrid RAG with BM25 + Dense")
