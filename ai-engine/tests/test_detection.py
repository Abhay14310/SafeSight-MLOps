"""
Tests for ai-engine/src/detection.py

The PR change: removed trailing blank line (W391 flake8 violation) from detection.py.
These tests verify the module is a clean, importable Python file with no linting
violations, and establish the baseline module invariants for future implementation.
"""
import importlib
import os
import subprocess
import sys
import types

import pytest

# Ensure the src directory is on the path for importing detection
SRC_DIR = os.path.join(os.path.dirname(__file__), "..", "src")
SRC_DIR = os.path.abspath(SRC_DIR)
DETECTION_FILE = os.path.join(SRC_DIR, "detection.py")


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(scope="module")
def detection_module():
    """Import and return the detection module."""
    if SRC_DIR not in sys.path:
        sys.path.insert(0, SRC_DIR)
    # Force a fresh import in case of stale cache
    if "detection" in sys.modules:
        del sys.modules["detection"]
    return importlib.import_module("detection")


# ---------------------------------------------------------------------------
# File-level tests (directly testing what the PR fixed)
# ---------------------------------------------------------------------------


class TestDetectionFileContent:
    """Tests targeting the file-level content of detection.py.

    The PR removed the trailing blank line that caused flake8 W391.
    """

    def test_detection_file_exists(self):
        """detection.py must exist at the expected path."""
        assert os.path.isfile(DETECTION_FILE), (
            f"detection.py not found at {DETECTION_FILE}"
        )

    def test_no_trailing_newline_w391(self):
        """File must not end with a trailing blank line (flake8 W391).

        W391 is triggered when the last line of a file is blank (empty or
        only whitespace followed by a newline). The PR fixed exactly this.
        """
        with open(DETECTION_FILE, "rb") as f:
            content = f.read()

        if len(content) == 0:
            # An entirely empty file has no trailing blank line — pass.
            return

        # W391: file ends with a blank line, i.e. '\n\n' at the very end
        # or the last line contains only whitespace.
        lines = content.split(b"\n")
        # Remove the final empty element caused by a single trailing newline
        # (which is acceptable — W391 fires only when there are ≥2 trailing
        # newlines or the final non-empty line is followed by a blank line).
        if lines and lines[-1] == b"":
            lines = lines[:-1]
        # After stripping the conventional final newline, the last remaining
        # element must NOT be blank/whitespace-only.
        if lines:
            assert lines[-1].strip() != b"", (
                "detection.py ends with a trailing blank line (W391 violation). "
                "The PR was supposed to remove this."
            )

    def test_no_trailing_blank_lines_regression(self):
        """Regression: ensure W391 does not re-appear in detection.py.

        Reads the raw bytes and asserts the file does not contain two
        consecutive newline characters at the very end.
        """
        with open(DETECTION_FILE, "rb") as f:
            content = f.read()

        if len(content) == 0:
            return  # Empty file is clean

        assert not content.endswith(b"\n\n"), (
            "detection.py ends with two consecutive newlines — this reintroduces "
            "the W391 trailing-blank-line violation the PR fixed."
        )

    def test_flake8_w391_passes(self):
        """Run flake8 with W391 selected and assert zero violations.

        Mirrors the CI linting step to guarantee the file stays clean.
        Requires flake8 to be installed in the test environment.
        """
        result = subprocess.run(
            [
                sys.executable, "-m", "flake8",
                DETECTION_FILE,
                "--select=W391",
            ],
            capture_output=True,
            text=True,
        )
        assert result.returncode == 0, (
            f"flake8 W391 check failed:\n{result.stdout}{result.stderr}"
        )

    def test_flake8_full_ci_config_passes(self):
        """Run flake8 with the same flags used in CI and assert zero violations.

        The CI configuration is:
            flake8 ai-engine/src/detection.py
                --max-line-length=120
                --ignore=E501,W503,E741
                --count
        """
        result = subprocess.run(
            [
                sys.executable, "-m", "flake8",
                DETECTION_FILE,
                "--max-line-length=120",
                "--ignore=E501,W503,E741",
                "--count",
            ],
            capture_output=True,
            text=True,
        )
        assert result.returncode == 0, (
            f"flake8 (CI config) check failed:\n{result.stdout}{result.stderr}"
        )

    def test_file_is_valid_python_syntax(self):
        """detection.py must contain valid Python syntax (py_compile check)."""
        import py_compile
        try:
            py_compile.compile(DETECTION_FILE, doraise=True)
        except py_compile.PyCompileError as exc:
            pytest.fail(f"detection.py contains a syntax error: {exc}")


# ---------------------------------------------------------------------------
# Module-level tests
# ---------------------------------------------------------------------------


class TestDetectionModuleImport:
    """Tests verifying the module can be cleanly imported."""

    def test_module_imports_without_error(self, detection_module):
        """Importing detection must not raise any exception."""
        assert detection_module is not None

    def test_module_is_python_module(self, detection_module):
        """Imported object must be a Python module type."""
        assert isinstance(detection_module, types.ModuleType)

    def test_module_name_is_detection(self, detection_module):
        """Module __name__ must be 'detection'."""
        assert detection_module.__name__ == "detection"

    def test_module_file_attribute_points_to_detection_py(self, detection_module):
        """Module __file__ must resolve to detection.py."""
        assert detection_module.__file__ is not None
        assert os.path.basename(detection_module.__file__) == "detection.py"

    def test_module_import_is_idempotent(self):
        """Importing the module multiple times must return the same object."""
        if SRC_DIR not in sys.path:
            sys.path.insert(0, SRC_DIR)
        mod1 = importlib.import_module("detection")
        mod2 = importlib.import_module("detection")
        assert mod1 is mod2

    def test_module_has_no_side_effects_on_import(self):
        """Re-importing detection must not alter sys.modules unexpectedly."""
        before = set(sys.modules.keys())
        # Remove cached module to force a fresh load
        sys.modules.pop("detection", None)
        if SRC_DIR not in sys.path:
            sys.path.insert(0, SRC_DIR)
        importlib.import_module("detection")
        after = set(sys.modules.keys())
        # The only new key allowed is 'detection' itself
        new_keys = after - before - {"detection"}
        assert new_keys == set(), (
            f"Importing detection introduced unexpected modules: {new_keys}"
        )


class TestDetectionModulePublicApi:
    """Tests verifying the public API surface of the (currently empty) module."""

    def _public_names(self, module):
        """Return public names (not starting with '_') defined in the module."""
        return [
            name for name in dir(module)
            if not name.startswith("_")
        ]

    def test_empty_module_has_no_public_symbols(self, detection_module):
        """A fresh, empty detection.py must export no public names.

        When the module is implemented, this test should be updated to
        enumerate the expected public API explicitly.
        """
        public = self._public_names(detection_module)
        assert public == [], (
            f"detection.py is expected to be empty but exports: {public}"
        )

    def test_module_docstring_is_none(self, detection_module):
        """An empty module must have no module-level docstring."""
        assert detection_module.__doc__ is None

    def test_module_has_no_classes(self, detection_module):
        """Empty module must define no classes."""
        classes = [
            name for name in dir(detection_module)
            if not name.startswith("_")
            and isinstance(getattr(detection_module, name), type)
        ]
        assert classes == []

    def test_module_has_no_functions(self, detection_module):
        """Empty module must define no functions."""
        import inspect
        functions = [
            name for name in dir(detection_module)
            if not name.startswith("_")
            and inspect.isfunction(getattr(detection_module, name))
        ]
        assert functions == []