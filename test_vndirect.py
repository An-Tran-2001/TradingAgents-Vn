from tradingagents.dataflows.vn_vendor import get_cafef_news, get_hose_announcements, get_fiin_fundamentals

print(get_cafef_news("FPT"))
print("----------------")
print(get_hose_announcements("FPT"))
print("----------------")
print(get_fiin_fundamentals("FPT"))
