from zhipuai import ZhipuAI
 
client = ZhipuAI(api_key="eba49b3f599145f533c7ed64795676fc.2cAAz6yRaXGhiogZ")  # 填写您自己的APIKey
 
response = client.web_search.web_search(
   search_engine="search_std",
   search_query="今日国内新闻",
   count=10,  # 返回结果的条数，范围1-50，默认10
   search_recency_filter="oneDay"  # 搜索指定日期范围内的内容
)
print(response)