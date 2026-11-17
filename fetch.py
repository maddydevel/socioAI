"""Fetch recent updates for the AI Follow Desk accounts into feed.json.
Usage: python3 -I fetch.py <outdir>
Sources: official blog RSS/Atom, Reddit RSS, Google News RSS search."""
import sys, json, re, time, html, urllib.request, urllib.parse, concurrent.futures as cf
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from datetime import datetime, timezone, timedelta

OUT = sys.argv[1]
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"
NOW = datetime.now(timezone.utc)
WINDOW_DAYS = 21

BLOGS = {
 "openai": "https://openai.com/news/rss.xml",
 "gdm": "https://deepmind.google/blog/rss.xml",
 "nvidia": "https://blogs.nvidia.com/feed/",
 "hf": "https://huggingface.co/blog/feed.xml",
 "langchain": "https://blog.langchain.com/rss/",
 "together": "https://www.together.ai/blog/rss.xml",
 "eleven": "https://elevenlabs.io/blog/rss.xml",
 "cursor": "https://cursor.com/changelog/rss.xml",
 "qwen": "https://qwenlm.github.io/blog/index.xml",
 "karpathy": "https://karpathy.bearblog.dev/feed/",
 "ethan": "https://www.oneusefulthing.org/feed",
 "chip": "https://huyenchip.com/feed.xml",
 "rasbt": "https://magazine.sebastianraschka.com/feed",
 "lilian": "https://lilianweng.github.io/index.xml",
 "jay": "https://newsletter.languagemodels.co/feed",
 "phil": "https://www.philschmid.de/rss",
 "simon": "https://simonwillison.net/atom/everything/",
}
SUBS = ["LocalLLaMA","MachineLearning","OpenAI","ClaudeAI","singularity","MistralAI","allenai","kimi"]
REDDIT_EXTRA = {"cohere": "https://www.reddit.com/user/Cohere/submitted/.rss"}
# Google News query per account (accounts with a blog get news too, capped lower)
NEWS = {
 "openai":'"OpenAI"', "anthropic":'"Anthropic" Claude', "gdm":'"Google DeepMind" OR Gemini', "nvidia":'Nvidia AI',
 "meta":'"Meta AI" OR "Meta Superintelligence"', "msft":'"Microsoft" Copilot OR "Microsoft AI"', "hf":'"Hugging Face"',
 "mistral":'"Mistral AI"', "pplx":'"Perplexity" AI', "langchain":'LangChain', "llamaindex":'LlamaIndex', "cohere":'"Cohere" AI',
 "cursor":'"Cursor" AI code editor OR Anysphere', "together":'"Together AI"', "fireworks":'"Fireworks AI"', "runway":'"Runway" AI video',
 "eleven":'ElevenLabs', "ai2":'"Allen Institute for AI" OR Ai2', "deepseek":'DeepSeek', "qwen":'Qwen Alibaba', "moonshot":'"Moonshot AI" OR "Kimi K3" OR "Kimi AI"',
 "zai":'"Z.ai" OR Zhipu GLM', "bytedance":'ByteDance AI Seed OR Doubao', "baidu":'Baidu ERNIE', "tencent":'Tencent Hunyuan OR "Tencent AI"',
 "minimax":'"MiniMax" AI', "01ai":'"01.AI" OR "Kai-Fu Lee"', "stepfun":'StepFun', "shlab":'"Shanghai AI Lab" OR InternLM', "huawei":'Huawei Ascend OR Pangu AI',
 "kling":'"Kling AI"', "sensetime":'SenseTime', "modelbest":'ModelBest OR MiniCPM OR OpenBMB',
 "sama":'"Sam Altman"', "dario":'"Dario Amodei"', "demis":'"Demis Hassabis"', "jensen":'"Jensen Huang"', "satya":'"Satya Nadella"',
 "sundar":'"Sundar Pichai"', "mustafa":'"Mustafa Suleyman"', "clem":'"Clem Delangue" OR "Clément Delangue"', "arthur":'"Arthur Mensch"',
 "aravind":'"Aravind Srinivas"', "harrison":'"Harrison Chase"', "elon":'"Elon Musk" xAI OR Grok', "alex":'"Alexandr Wang"', "thom":'"Thomas Wolf" Hugging Face',
 "aidan":'"Aidan Gomez"', "liang":'"Liang Wenfeng"', "junyang":'"Junyang Lin" OR "Lin Junyang"', "yang":'"Yang Zhilin"', "kaifu":'"Kai-Fu Lee"',
 "karpathy":'"Andrej Karpathy"', "ng":'"Andrew Ng"', "lecun":'"Yann LeCun"', "feifei":'"Fei-Fei Li"', "ilya":'"Ilya Sutskever"', "noam":'"Noam Shazeer"',
 "jeff":'"Jeff Dean"', "oriol":'"Oriol Vinyals"', "percy":'"Percy Liang"', "tri":'"Tri Dao"', "jim":'"Jim Fan" Nvidia', "chip":'"Chip Huyen"',
 "rasbt":'"Sebastian Raschka"', "phil":'"Philipp Schmid"', "jerry":'"Jerry Liu" LlamaIndex', "jay":'"Jay Alammar"', "allie":'"Allie K. Miller" OR "Allie Miller" AI',
 "lilian":'"Lilian Weng"', "ethan":'"Ethan Mollick"', "simon":'"Simon Willison"', "jianlin":'"Jianlin Su" OR "Su Jianlin"', "shunyu":'"Shunyu Yao"', "kaiming":'"Kaiming He"',
 "tml":'"Thinking Machines Lab" OR "Mira Murati"', "ssi":'"Safe Superintelligence"', "worldlabs":'"World Labs" Fei-Fei', "reflection":'"Reflection AI"',
}
# Keywords that tag Reddit posts with the accounts they discuss
MENTIONS = {
 "openai":r"\bopenai\b|chatgpt|\bgpt-?\d|\bsora\b|\bcodex\b", "anthropic":r"anthropic|\bclaude\b", "gdm":r"deepmind|\bgemini\b|\bgemma\b",
 "nvidia":r"nvidia|nemotron|\brtx\b", "meta":r"\bllama\b|meta ai|\bmeta\b", "msft":r"microsoft|copilot|\bphi-?\d", "hf":r"hugging ?face",
 "mistral":r"mistral|devstral|magistral", "pplx":r"perplexity", "cursor":r"\bcursor\b", "eleven":r"elevenlabs", "ai2":r"\bai2\b|\bolmo\b|allen ai|allenai",
 "deepseek":r"deepseek", "qwen":r"\bqwen", "moonshot":r"\bkimi\b|moonshot", "zai":r"\bglm\b|z\.ai|zhipu", "bytedance":r"bytedance|\bseed-?oss|doubao",
 "baidu":r"\bernie\b|baidu", "tencent":r"tencent|hunyuan|\bhy\d", "minimax":r"minimax|hailuo", "stepfun":r"stepfun|\bstep-?\d", "kling":r"\bkling",
 "huawei":r"huawei|ascend|pangu", "sama":r"altman", "dario":r"amodei", "demis":r"hassabis", "jensen":r"jensen", "elon":r"\bmusk\b|\bgrok\b|\bxai\b",
 "karpathy":r"karpathy", "lecun":r"lecun", "ilya":r"sutskever|\bilya\b", "tml":r"thinking machines|murati", "ssi":r"safe superintelligence",
}
ATOM = "{http://www.w3.org/2005/Atom}"
def _relev(aid, q):
    terms = re.findall(r'"([^"]+)"', q) or [q.split()[0]]
    if aid in MENTIONS and aid != "moonshot": return MENTIONS[aid] + "|" + "|".join(re.escape(t) for t in terms)
    return "|".join(re.escape(t) for t in terms)
RELEV = {aid: _relev(aid, q) for aid, q in NEWS.items()}
RELEV["moonshot"] = r"moonshot|kimi (k\d|ai|chat)|kimi-k"
RELEV["elon"] = r"musk.*(xai|grok|\bai\b)|(xai|grok).*musk|\bgrok\b|\bxai\b"
RELEV["nvidia"] = r"nvidia"

def get(url, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*"})
            with urllib.request.urlopen(req, timeout=25) as r:
                return r.read()
        except Exception as e:
            err = e
            time.sleep(1.5 * (i + 1))
    print("FAIL", url, err, file=sys.stderr)
    return None

def clean(s, n=260):
    if not s: return ""
    s = html.unescape(re.sub(r"<[^>]+>", " ", s))
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"submitted by /u/\S+.*$", "", s).strip()
    return (s[:n].rsplit(" ", 1)[0] + "…") if len(s) > n else s

def pdate(s):
    if not s: return None
    s = s.strip()
    try:
        d = parsedate_to_datetime(s)
    except Exception:
        try:
            d = datetime.fromisoformat(s.replace("Z", "+00:00"))
        except Exception:
            return None
    if d.tzinfo is None: d = d.replace(tzinfo=timezone.utc)
    return d.astimezone(timezone.utc)

def parse(raw):
    """Yield dicts with title, link, date, summary, source from RSS2 or Atom."""
    try:
        root = ET.fromstring(raw)
    except ET.ParseError:
        return []
    out = []
    if root.tag == ATOM + "feed":
        for e in root.findall(ATOM + "entry"):
            link = ""
            for l in e.findall(ATOM + "link"):
                if l.get("rel", "alternate") == "alternate": link = l.get("href", ""); break
            out.append({"title": (e.findtext(ATOM + "title") or "").strip(), "link": link,
                        "date": pdate(e.findtext(ATOM + "published") or e.findtext(ATOM + "updated")),
                        "summary": e.findtext(ATOM + "summary") or e.findtext(ATOM + "content") or "",
                        "author": e.findtext(f"{ATOM}author/{ATOM}name") or ""})
    else:
        for it in root.iter("item"):
            src = it.find("source")
            out.append({"title": (it.findtext("title") or "").strip(), "link": (it.findtext("link") or "").strip(),
                        "date": pdate(it.findtext("pubDate") or it.findtext("{http://purl.org/dc/elements/1.1/}date")),
                        "summary": it.findtext("description") or "", "source": src.text if src is not None else ""})
    return out

def recent(d, days=WINDOW_DAYS):
    return d is not None and d > NOW - timedelta(days=days) and d < NOW + timedelta(days=1)

items, status = [], {}

def do_blog(aid, url):
    raw = get(url)
    if not raw: return aid, "blog", []
    rows = [e for e in parse(raw) if recent(e["date"], 45)]
    rows.sort(key=lambda e: e["date"], reverse=True)
    return aid, "blog", [{"a": aid, "via": "Blog", "title": clean(e["title"], 200), "body": clean(e["summary"]), "url": e["link"],
                          "src": urllib.parse.urlparse(url).netloc.replace("www.", ""), "date": e["date"].isoformat()} for e in rows[:4]]

def do_reddit(key, url):
    raw = get(url)
    if not raw: return key, "reddit", []
    rows = [e for e in parse(raw) if recent(e["date"], 10)]
    res = []
    for e in rows[:12]:
        res.append({"a": key, "via": "Reddit", "title": clean(e["title"], 220), "body": clean(e["summary"], 200), "url": e["link"],
                    "src": "r/" + key.replace("sub-", "") if key.startswith("sub-") else "u/Cohere", "date": e["date"].isoformat()})
    return key, "reddit", res

def do_news(aid, q):
    url = "https://news.google.com/rss/search?" + urllib.parse.urlencode({"q": q + " when:7d", "hl": "en-US", "gl": "US", "ceid": "US:en"})
    raw = get(url)
    if not raw: return aid, "news", []
    rows = [e for e in parse(raw) if recent(e["date"], 8)]
    rows.sort(key=lambda e: e["date"], reverse=True)
    res, seen = [], set()
    for e in rows:
        t = e["title"]; srcname = e.get("source") or ""
        if not re.search(RELEV[aid], t, re.I): continue
        if srcname and t.endswith(" - " + srcname): t = t[: -len(srcname) - 3]
        k = t.lower()[:60]
        if k in seen: continue
        seen.add(k)
        res.append({"a": aid, "via": "News", "title": clean(t, 220), "body": "", "url": e["link"], "src": srcname or "Google News", "date": e["date"].isoformat()})
        if len(res) >= 3: break
    return aid, "news", res

jobs = []
with cf.ThreadPoolExecutor(max_workers=6) as ex:
    for aid, url in BLOGS.items(): jobs.append(ex.submit(do_blog, aid, url))
    for aid, q in NEWS.items(): jobs.append(ex.submit(do_news, aid, q))
    for j in cf.as_completed(jobs):
        aid, kind, res = j.result()
        status[f"{kind}:{aid}"] = len(res)
        items.extend(res)

for s in SUBS + list(REDDIT_EXTRA):
    url = REDDIT_EXTRA.get(s) or f"https://www.reddit.com/r/{s}/top/.rss?t=week"
    key = s if s in REDDIT_EXTRA else "sub-" + s
    for attempt in range(3):
        k, kind, res = do_reddit(key, url)
        if res: break
        time.sleep(8)
    status[f"reddit:{key}"] = len(res); items.extend(res)
    time.sleep(3)

# r/kimi and r/MistralAI / r/allenai belong to the company accounts too
OWNER = {"sub-MistralAI": "mistral", "sub-allenai": "ai2"}
for it in items:
    if it["via"] == "Reddit":
        tags = [a for a, rx in MENTIONS.items() if re.search(rx, it["title"], re.I)]
        if it["a"] == "sub-kimi": tags.insert(0, "moonshot"); it["a"] = "moonshot"
        elif it["a"] in OWNER: tags.insert(0, OWNER[it["a"]])
        it["tags"] = list(dict.fromkeys(tags))[:4]

# de-duplicate by url
seen, final = set(), []
for it in sorted(items, key=lambda x: x["date"], reverse=True):
    if not it["url"] or it["url"] in seen or not it["title"]: continue
    seen.add(it["url"]); final.append(it)

json.dump({"fetched": NOW.isoformat(), "items": final, "status": status}, open(f"{OUT}/feed.json", "w"), ensure_ascii=False)
empty = sorted(k for k, v in status.items() if v == 0)
print(len(final), "items;", "empty sources:", len(empty))
print(", ".join(empty))
