#!/usr/bin/env python3

import os, re, sys

from markdownTable import markdownTable  # pip install py-markdown-table

class TEP:
    FIELD_PARSERS = {
        "TEP": lambda v: re.findall(r"\[(\d+)\]\((.+)\)", v)[0],  # [num](pr link)
        "title": lambda v: v,
        "status": lambda v: v,
        "type": lambda v: v,
        "authors": lambda v: re.findall(r"\[(.+?)\]\((.+?)\)", v), # [author name](author link),
        "created": lambda v: v,
        "replaces": lambda v: v,
        "replaced by": lambda v: v,
    }

    def __init__(self, data):
        for k, v in data.items():
            setattr(self, k, v)

    @classmethod
    def from_raw(cls, text):
        data = {}
        for line in text.split('\n'):
            entry = re.findall(r"- \*\*(.+?)\*\*: (.+)", line)
            if len(entry) == 0:
                break
            key, value = entry[0]
            if key not in cls.FIELD_PARSERS:
                raise RuntimeError(f"unknown field '{key}'")
                data[key] = value
            data[key] = cls.FIELD_PARSERS[key](value)
        if not set(data.keys()).issuperset(set(cls.FIELD_PARSERS.keys())):
            raise RuntimeError(f"missing fields {set(cls.FIELD_PARSERS.keys()) - set(data.keys())}")
        return TEP(data)


def get_teps(folder="./text/"):
    tep_filenames = [os.path.join(folder, filename) for filename in os.listdir(folder) if filename.endswith('.md')]
    teps = []
    for filename in tep_filenames:
        with open(filename) as f:
            try:
                teps.append((filename, TEP.from_raw(f.read())))
            except Exception as e:
                print(f"failed to process {filename}: {e!r}")
                raise e
    return teps


if __name__ == '__main__':
    teps = get_teps(sys.argv[1] if len(sys.argv) > 1 else "./text/")
    teps.sort(key=lambda tep: int(tep[1].TEP[0]))
    teps_by_status = {}
    for tep in teps:
        tep_filename = tep[0]
        tep = tep[1]
        if teps_by_status.get(tep.status) is None:
            teps_by_status[tep.status] = []
        teps_by_status[tep.status].append({
            "TEP": f"[{tep.TEP[0]}]({tep_filename})",
            "Title": tep.title,
            "Type": tep.type,
            "Created": tep.created,
        })
    for k, v in teps_by_status.items():
        print(f"## {k}")
        print(markdownTable(v).setParams(row_sep='markdown', quote=False).getMarkdown())
        print()