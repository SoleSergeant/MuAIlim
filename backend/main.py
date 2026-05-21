from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import questions, mock, analysis, leaderboard, notebook

app = FastAPI(title="MuAIlim API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(questions.router, prefix="/api")
app.include_router(mock.router, prefix="/api")
app.include_router(analysis.router, prefix="/api")
app.include_router(leaderboard.router, prefix="/api")
app.include_router(notebook.router, prefix="/api")


@app.get("/")
async def root():
    return {"app": "MuAIlim API", "status": "running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
