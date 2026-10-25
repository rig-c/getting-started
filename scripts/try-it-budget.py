"""Linux shared-pool budget: four CPUs and 6 GiB for the command's process tree."""
import os
from pathlib import Path
import signal
import subprocess
import sys
import time


def main():
    if len(sys.argv) < 2 or not sys.platform.startswith('linux'):
        raise SystemExit('usage: python3 scripts/try-it-budget.py <command> [args]; Linux required')
    cpus = sorted(os.sched_getaffinity(0))[:4]
    os.sched_setaffinity(0, cpus)
    child = subprocess.Popen(sys.argv[1:], start_new_session=True)
    peak = 0
    owned = {child.pid}
    try:
        while child.poll() is None:
            processes = {}
            for directory in Path('/proc').iterdir():
                if not directory.name.isdigit():
                    continue
                try:
                    stat = (directory / 'stat').read_text().rsplit(')', 1)[1].split()
                    processes[int(directory.name)] = (int(stat[1]), int((directory / 'statm').read_text().split()[1]) * os.sysconf('SC_PAGE_SIZE'))
                except (FileNotFoundError, ProcessLookupError):
                    pass
            owned = {child.pid}
            while True:
                descendants = {pid for pid, (parent, _) in processes.items() if parent in owned}
                if descendants <= owned:
                    break
                owned |= descendants
            rss = sum(processes[pid][1] for pid in owned if pid in processes)
            peak = max(peak, rss)
            if rss > 6 * 1024**3:
                print('BUDGET: process-tree RSS exceeds 6 GiB', file=sys.stderr)
                return 137
            time.sleep(0.1)
        return child.returncode
    finally:
        if child.poll() is None:
            for pid in owned:
                try:
                    os.kill(pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
            child.wait()
        print(f'BUDGET cpus={len(cpus)} peak_tree_rss_bytes={peak}')


if __name__ == '__main__':
    sys.exit(main())
