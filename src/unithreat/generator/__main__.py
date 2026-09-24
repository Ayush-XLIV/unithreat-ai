"""
CLI entry point for running unithreat.generator as an executable module:
    python -m unithreat.generator --count 1000 --rate 10 --attack-ratio 20 --attack-type mixed
"""

import sys
from unithreat.generator.traffic import main

if __name__ == "__main__":
    sys.exit(main())
