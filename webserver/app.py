from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pymongo
import mongoenv

conn_str = mongoenv.mongo_connstr_gmailutils
client = pymongo.MongoClient(conn_str, serverSelectionTimeoutMS=5000)
db = client["GmailUtils"]
mails_collection = db["mails"]

class NewMailPostData(BaseModel):
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
async def newMail(data: NewMailPostData):
  print(data)
  # mails_collection.insert_one({
  #   "mid": data.mid,
  #   "hasOpened": False,
  #   "openedTimestamp": 0,
  # })
