import requests

def test():
    try:
        url = "http://127.0.0.1:8000/api/resumes/latest"
        print(f"Requesting GET {url}...")
        response = requests.get(url)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test()
