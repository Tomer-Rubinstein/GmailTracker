from fastapi import FastAPI
from pydantic import BaseModel


class NewMailPostData(BaseModel):
  mid: str


app = FastAPI()
dummyDb = [] # TODO implement postgresql


@app.post("/newMail/")
async def newMail(data: NewMailPostData):
  dummyDb.append(data["mid"]) 
  print(dummyDb)
