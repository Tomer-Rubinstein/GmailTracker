from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
import pymongo
import mongoenv
import time

conn_str = mongoenv.mongo_connstr_gmailutils # TODO: sort up the env vars shenanigans
client = pymongo.MongoClient(conn_str, serverSelectionTimeoutMS=5000)
db = client["GmailUtils"]
mails_collection = db["mails"]


class PostDataModel(BaseModel):
  mid: str


app = FastAPI()

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"]
)

@app.post("/newMail")
async def newMail(data: PostDataModel):
  print("/newMail", data)
  mails_collection.insert_one({
    "mid": data.mid,
    "iat": int(time.time()),
    "lastOpened": 0,
  })


@app.get("/read")
async def readMail(mid: str):
  print(f"opened mail {mid}")
  mails_collection.update_one({"mid": mid}, {"$set": {"lastOpened": int(time.time())}})


@app.post("/status")
async def getStatus(data: PostDataModel):
  status = mails_collection.find_one({"mid": data.mid})
  return JSONResponse(content=jsonable_encoder({"lastOpened": status["lastOpened"]}))
