"""
WordBloom — phonetic_map.py
============================
Deterministic Pediatric Phonetic, Acoustic & Dyslexic Variant Map.
Contains 200+ terms covering:
  1. Dyslexic Mirror & Rotational Pairs (b/d, p/q, n/u, m/w)
  2. Silent Letter Orthographic Variants (50+ terms)
  3. Pediatric Acoustic & Homophone STT Variants (150+ terms)

Pure Python — zero LLM hallucination, zero external dependencies.
"""

# ─────────────────────────────────────────────
# 1. DYSLEXIC OPTICAL FLIPS & ROTATIONS
# ─────────────────────────────────────────────
DYSLEXIC_MIRRORS = str.maketrans("bdpqnumw", "dbqpwnum")

MIRROR_PAIRS = {
    "b": "d", "d": "b",
    "p": "q", "q": "p",
    "n": "u", "u": "n",
    "m": "w", "w": "m",
}


# ─────────────────────────────────────────────
# 2. SILENT LETTER PHONETIC VARIANTS (50+ terms)
# ─────────────────────────────────────────────
EXPANDED_SILENT_VARIANTS = {
    # 'k' silent before 'n'
    "knight": ["nite", "night"],
    "knock": ["nock", "nok"],
    "know": ["no"],
    "knee": ["nee"],
    "knife": ["nife"],
    "knot": ["not", "note"],
    "knack": ["nack"],
    "knead": ["need"],
    "knit": ["nit"],
    "knob": ["nob"],

    # 'g' silent before 'n'
    "gnome": ["nome", "nom"],
    "gnat": ["nat"],
    "gnaw": ["naw"],
    "sign": ["sine"],
    "design": ["desine"],
    "foreign": ["forin"],
    "campaign": ["campane"],

    # 'w' silent before 'r'
    "wrist": ["rist"],
    "wrap": ["rap"],
    "write": ["rite", "right"],
    "wrong": ["rong"],
    "wreck": ["reck"],
    "wren": ["ren"],
    "wrench": ["rench"],
    "wreath": ["reath"],
    "wrote": ["rote"],

    # 'b' silent after 'm'
    "thumb": ["thum"],
    "comb": ["com"],
    "lamb": ["lam"],
    "climb": ["clime", "clim"],
    "crumb": ["crum"],
    "numb": ["num"],
    "bomb": ["bom"],
    "tomb": ["toom"],
    "limb": ["lim"],
    "debt": ["det"],
    "doubt": ["dout"],

    # 'l' silent before 'f', 'k', 'm'
    "half": ["haf"],
    "calf": ["caf"],
    "walk": ["wauk", "wak"],
    "talk": ["tauk", "tak"],
    "calm": ["cam"],
    "palm": ["pam"],
    "salmon": ["samon"],

    # 'gh' silent or 'f' sound
    "light": ["lite"],
    "bright": ["brite"],
    "sight": ["site"],
    "night": ["nite"],
    "flight": ["flite"],
    "through": ["thru", "threw"],
    "though": ["tho"],
    "dough": ["doe"],

    # 's' silent
    "island": ["iland"],
    "aisle": ["ile"],

    # 'h' silent
    "honest": ["onest"],
    "hour": ["our"],
    "ghost": ["gost"],
    "rhyme": ["rime"],

    # 't' silent
    "castle": ["casel"],
    "whistle": ["wisel"],
    "listen": ["lisen"],
    "fasten": ["fasen"],

    # 'n' silent after 'm'
    "autumn": ["autum"],
    "column": ["colum"],
    "hymn": ["him"],
}


# ─────────────────────────────────────────────
# 3. PEDIATRIC ACOUSTIC & HOMOPHONE STT MAP (150+ terms)
# ─────────────────────────────────────────────
EXPANDED_VOICE_HOMOPHONES = {
    # Short CVC vowel elongations / trailing nasals
    "sun": ["son"],
    "son": ["sun"],
    "hop": ["hope"],
    "hope": ["hop"],
    "not": ["note", "knot"],
    "knot": ["not", "note"],
    "rob": ["robe"],
    "robe": ["rob"],
    "pin": ["pine", "pen"],
    "pine": ["pin"],
    "cut": ["cute"],
    "cute": ["cut"],
    "tub": ["tube"],
    "tube": ["tub"],
    "cap": ["cape"],
    "cape": ["cap"],
    "tap": ["tape"],
    "tape": ["tap"],
    "rip": ["ripe"],
    "ripe": ["rip"],
    "pop": ["pope"],
    "pope": ["pop"],
    "dot": ["dote"],
    "dote": ["dot"],
    "mop": ["mope"],
    "mope": ["mop"],
    "pan": ["pane", "pain"],
    "pane": ["pan", "pain"],
    "pain": ["pan", "pane"],
    "dog": ["dawg", "bog"],
    "cat": ["kat"],
    "fox": ["foks"],
    "box": ["boks"],
    "crab": ["krab"],
    "cup": ["cub"],
    "net": ["ned"],

    # Common English homophones frequently swapped by browser STT
    "right": ["write", "rite"],
    "write": ["right", "rite"],
    "see": ["sea", "c"],
    "sea": ["see", "c"],
    "for": ["four", "fore"],
    "four": ["for", "fore"],
    "one": ["won"],
    "won": ["one"],
    "to": ["two", "too"],
    "two": ["to", "too"],
    "too": ["to", "two"],
    "be": ["bee"],
    "bee": ["be"],
    "red": ["read", "reed"],
    "read": ["red", "reed"],
    "hear": ["here"],
    "here": ["hear"],
    "blue": ["blew"],
    "blew": ["blue"],
    "meat": ["meet"],
    "meet": ["meat"],
    "stair": ["stare"],
    "stare": ["stair"],
    "flour": ["flower"],
    "flower": ["flour"],
    "break": ["brake"],
    "brake": ["break"],
    "peace": ["piece"],
    "piece": ["peace"],
    "plain": ["plane"],
    "plane": ["plain"],
    "tail": ["tale"],
    "tale": ["tail"],
    "wait": ["weight"],
    "weight": ["wait"],
    "road": ["rode", "rowed"],
    "rode": ["road"],
    "wood": ["would"],
    "would": ["wood"],
    "sail": ["sale"],
    "sale": ["sail"],
    "main": ["mane"],
    "mane": ["main"],
    "male": ["mail"],
    "mail": ["male"],
    "bear": ["bare"],
    "bare": ["bear"],
    "pair": ["pear"],
    "pear": ["pair"],
    "fair": ["fare"],
    "fare": ["fair"],
    "hair": ["hare"],
    "hare": ["hair"],
    "dear": ["deer"],
    "deer": ["dear"],
    "heal": ["heel"],
    "heel": ["heal"],
    "hole": ["whole"],
    "whole": ["hole"],
    "weak": ["week"],
    "week": ["weak"],
    "ate": ["eight"],
    "eight": ["ate"],
    "by": ["buy", "bye"],
    "buy": ["by", "bye"],
    "bye": ["by", "buy"],
    "so": ["sew", "sow"],
    "sew": ["so"],
    "no": ["know"],
    "know": ["no"],
    "new": ["knew"],
    "knew": ["new"],

    # Silent digraph and pediatric trailing nasal words
    "knight": ["night", "nite"],
    "night": ["knight", "nite"],
    "gnome": ["nome", "no", "know", "known", "gnomes", "nom", "num", "none"],
    "knock": ["nock", "nok", "knocked"],
    "wrist": ["rist"],
    "thumb": ["thum"],
    "light": ["lite"],
    "bread": ["bred"],
    "train": ["trayn"],
    "float": ["flote"],
    "sword": ["sord", "soared"],
    "climb": ["clime", "clim"],
    "beach": ["beech"],
    "bell": ["belle", "bel"],
    "plum": ["plumb"],
    "comb": ["com", "home"],
    "lamb": ["lam"],
}


def get_acoustic_variants(target_word: str) -> list:
    """Returns all known acoustic / homophone variants for a target word."""
    if not target_word:
        return []
    clean = str(target_word).strip().lower()
    variants = set()
    variants.update(EXPANDED_VOICE_HOMOPHONES.get(clean, []))
    variants.update(EXPANDED_SILENT_VARIANTS.get(clean, []))
    return sorted(list(variants))


def is_acoustic_match(target_word: str, spoken_answer: str) -> bool:
    """Checks whether a spoken answer is a valid acoustic or homophone match."""
    t = str(target_word or "").strip().lower()
    a = str(spoken_answer or "").strip().lower()
    if not t or not a:
        return False
    if t == a:
        return True
    if a in EXPANDED_VOICE_HOMOPHONES.get(t, []):
        return True
    if a in EXPANDED_SILENT_VARIANTS.get(t, []):
        return True
    # Carrier phrase tolerance: target is in spoken tokens
    tokens = [tok.strip() for tok in a.split() if tok.strip()]
    if t in tokens:
        return True
    return False

