import os

class Variables:
    def __init__(self):
        self.sentinal = None
        self.csv_file_path = f'{os.getcwd()}/500_websites.csv'
        self.max_worker = 100
        self.max_concurrent_requests = 20
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/136.0 Safari/537.36"
            )
}
variables = Variables()