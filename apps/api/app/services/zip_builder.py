import io
import zipfile


def build_zip(project_name: str, files: dict[str, str]) -> bytes:
    """Pack {relative_path: content} into a ZIP bytes object in memory."""
    buffer = io.BytesIO()

    with zipfile.ZipFile(buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for relative_path, content in files.items():
            # All files live inside a top-level folder named after the project
            archive_path = f"{project_name}/{relative_path}"
            zf.writestr(archive_path, content)

    buffer.seek(0)
    return buffer.getvalue()
