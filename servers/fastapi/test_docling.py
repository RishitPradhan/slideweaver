try:
    print("Testing docling import...")
    import docling
    print("docling imported successfully")
    from docling.document_converter import DocumentConverter
    print("DocumentConverter imported successfully")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
