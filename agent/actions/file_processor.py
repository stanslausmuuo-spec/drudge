import os

def read_and_summarize_file(file_path: str) -> str:
    """Read local file content for summarization or analysis."""
    try:
        clean_path = os.path.normpath(file_path).lstrip("/")
        if ".." in clean_path:
            return "Error: Invalid path."
        
        base_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.abspath(os.path.join(base_dir, "..", ".."))
        full_path = os.path.join(root_dir, clean_path)

        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            return f"Error: File '{file_path}' not found."

        with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read(10000)
        return f"File Content ({file_path}):\n{content}"
    except Exception as e:
        return f"Error processing file: {str(e)}"
