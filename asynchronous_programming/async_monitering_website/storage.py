import os
import pandas as pd
from python_learnings.asynchronous_programming.async_monitering_website.models import WebsiteResult

async def update_status_to_csv(result: list[WebsiteResult]) -> None:
    df = pd.DataFrame(
        [r.model_dump() for r in result]
    )
    df.to_csv(
        "results.csv",
        index=False,
        mode="a",
        header=not os.path.exists("results.csv")
    )
