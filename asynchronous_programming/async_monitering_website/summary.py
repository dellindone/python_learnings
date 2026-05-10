from python_learnings.asynchronous_programming.async_monitering_website.models import WebsiteResult

def print_summary(results: list[WebsiteResult]) -> None:
    summary = {}
    for result in results: summary[result.status] = summary.get(result.status, 0) + 1
    for status, count in summary.items(): print(f"{status}: {count}")
