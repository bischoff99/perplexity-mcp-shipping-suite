# Python Development Rules

## File Patterns

### Python Source Files
- `**/*.py` - Python source files
- `**/test_*.py` - Test files (pytest convention)
- `**/*_test.py` - Alternative test files
- `scripts/*.py` - Python automation scripts
- `**/__init__.py` - Package initialization files

### Python Configuration
- `pyproject.toml` - Modern Python project configuration
- `requirements*.txt` - Dependency specifications
- `setup.py` - Package setup (legacy)
- `Pipfile` - Pipenv dependencies
- `.python-version` - Python version specification

## DO: Python Best Practices

### Code Quality
- **Use type hints** for all function parameters and return values
- **Follow PEP 8** style guide for code formatting
- **Use descriptive variable names** that explain intent
- **Write docstrings** for all public functions and classes
- **Use f-strings** for string formatting instead of `.format()` or `%`
- **Import modules, not individual functions** when possible

### Error Handling
- **Use specific exception types** instead of bare `except:`
- **Handle exceptions at the appropriate level** - don't catch and re-raise unnecessarily
- **Use context managers** (`with` statements) for resource management
- **Log errors with appropriate detail** including context and stack traces
- **Fail fast** - validate inputs early and clearly

### Dependencies and Environment
- **Use virtual environments** for all projects
- **Pin dependency versions** in production
- **Use `pyproject.toml`** for modern project configuration
- **Separate dev/test/prod dependencies** clearly
- **Use `pipx`** for global tool installation

### Testing
- **Use pytest** as the testing framework
- **Write tests before implementing features** (TDD when possible)
- **Use descriptive test names** that explain what is being tested
- **Use fixtures** for common test setup
- **Mock external dependencies** in unit tests
- **Achieve >80% test coverage**

### Performance
- **Use list comprehensions** for simple transformations
- **Use generators** for large datasets to save memory
- **Profile code** before optimizing
- **Use appropriate data structures** (set for membership, dict for lookups)
- **Avoid premature optimization**

## DON'T: Python Anti-Patterns

### Code Anti-Patterns
- **Don't use mutable default arguments** - use `None` and check in function
- **Don't use `global` variables** - pass data through function parameters
- **Don't import `*`** - be explicit about what you're importing
- **Don't catch `Exception`** without re-raising or handling appropriately
- **Don't use bare `except:`** clauses
- **Don't use `eval()` or `exec()`** with untrusted input

### Development Anti-Patterns
- **Don't install packages globally** - use virtual environments
- **Don't commit `.pyc` files** or `__pycache__` directories
- **Don't hard-code file paths** - use `pathlib` or `os.path`
- **Don't ignore deprecation warnings**
- **Don't mix tabs and spaces** - use spaces consistently

### Performance Anti-Patterns
- **Don't use `+` for string concatenation** in loops - use `join()`
- **Don't create unnecessary copies** of large data structures
- **Don't use `range(len(list))`** - iterate directly over the list
- **Don't ignore memory usage** in long-running processes

## Examples

### Good Python Code
```python
from pathlib import Path
from typing import List, Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

def process_shipment_data(
    data: Dict[str, Any], 
    output_dir: Optional[Path] = None
) -> List[Dict[str, Any]]:
    """Process shipment data and return formatted results.
    
    Args:
        data: Raw shipment data from API
        output_dir: Optional directory to save processed files
        
    Returns:
        List of processed shipment records
        
    Raises:
        ValueError: If data format is invalid
        FileNotFoundError: If output_dir doesn't exist
    """
    if not data or 'shipments' not in data:
        raise ValueError("Invalid data format: missing 'shipments' key")
    
    if output_dir and not output_dir.exists():
        raise FileNotFoundError(f"Output directory does not exist: {output_dir}")
    
    processed = []
    for shipment in data['shipments']:
        try:
            processed_record = {
                'id': shipment['id'],
                'status': shipment.get('status', 'unknown'),
                'created_at': shipment['created_at'],
                'tracking_code': shipment.get('tracking_code'),
            }
            processed.append(processed_record)
        except KeyError as e:
            logger.warning(f"Skipping shipment due to missing field: {e}")
            continue
    
    if output_dir:
        output_file = output_dir / f"processed_shipments_{len(processed)}.json"
        with output_file.open('w') as f:
            json.dump(processed, f, indent=2)
        logger.info(f"Saved {len(processed)} records to {output_file}")
    
    return processed
```

### Good Test Example
```python
import pytest
from unittest.mock import Mock, patch
from pathlib import Path
import tempfile

from shipment_processor import process_shipment_data

class TestShipmentProcessor:
    """Test suite for shipment data processing."""
    
    @pytest.fixture
    def sample_data(self):
        """Sample shipment data for testing."""
        return {
            'shipments': [
                {
                    'id': 'shp_123',
                    'status': 'created',
                    'created_at': '2024-01-01T00:00:00Z',
                    'tracking_code': 'ABC123'
                },
                {
                    'id': 'shp_456',
                    'status': 'shipped',
                    'created_at': '2024-01-02T00:00:00Z',
                }
            ]
        }
    
    def test_process_shipment_data_success(self, sample_data):
        """Test successful processing of shipment data."""
        result = process_shipment_data(sample_data)
        
        assert len(result) == 2
        assert result[0]['id'] == 'shp_123'
        assert result[0]['tracking_code'] == 'ABC123'
        assert result[1]['tracking_code'] is None
    
    def test_process_shipment_data_invalid_input(self):
        """Test handling of invalid input data."""
        with pytest.raises(ValueError, match="Invalid data format"):
            process_shipment_data({})
    
    def test_process_shipment_data_with_output_dir(self, sample_data):
        """Test processing with file output."""
        with tempfile.TemporaryDirectory() as temp_dir:
            output_dir = Path(temp_dir)
            result = process_shipment_data(sample_data, output_dir)
            
            output_files = list(output_dir.glob("processed_shipments_*.json"))
            assert len(output_files) == 1
            assert len(result) == 2
```

### Python Project Structure
```
project/
├── src/
│   └── package_name/
│       ├── __init__.py
│       ├── main.py
│       └── utils.py
├── tests/
│   ├── __init__.py
│   ├── test_main.py
│   └── test_utils.py
├── scripts/
│   └── automation.py
├── pyproject.toml
├── requirements.txt
├── requirements-dev.txt
└── README.md
```

### pyproject.toml Example
```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "shipment-processor"
version = "1.0.0"
description = "Shipment data processing utilities"
requires-python = ">=3.11"
dependencies = [
    "requests>=2.31.0",
    "pydantic>=2.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0.0",
    "pytest-cov>=4.0.0",
    "black>=23.0.0",
    "ruff>=0.1.0",
    "mypy>=1.0.0",
]

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py", "*_test.py"]
addopts = "--cov=src --cov-report=html --cov-report=term-missing"

[tool.black]
line-length = 88
target-version = ['py311']

[tool.ruff]
select = ["E", "F", "W", "B", "I"]
line-length = 88
target-version = "py311"

[tool.mypy]
python_version = "3.11"
strict = true
warn_return_any = true
warn_unused_configs = true
```

Use Python 3.11+ features when available, and always prioritize code readability and maintainability.