from bs4 import BeautifulSoup
import urllib.request
import time

# (1) Get urls for each team
urls = {}
for page in range(1, 4):
  base_url = "http://www.stickpng.com"
  search_url = base_url + "/cat/sports/baseball/major-league-baseball-mlb"
  page_url = search_url + "?page=" + str(page)

  source = urllib.request.urlopen(page_url).read()
  soup = BeautifulSoup(source, 'lxml')
  links = soup.find_all('a', class_='image')

  for link in links:
    url = base_url + link['href']
    team_name = link.find('img')['alt']
    urls[team_name] = url
    print(url)

# (2) Visit each url and download particular logos
count = 0
team_names = urls.keys()
for name in team_names:
  logo_names = [
    name + " Logo",
    name + " Text Logo",
    name + " " + name[0] + " Logo",
    name + " " + name.split(" ")[0][0] + name.split(" ")[1][0] + " Logo"
  ]

  team_source = urllib.request.urlopen(urls[name]).read()
  team_soup = BeautifulSoup(team_source, 'lxml')
  team_links = team_soup.find_all('a', class_="image pattern")

  for link in team_links:
    alt = link.find('img')['alt']
    if "Logo" in alt:
      href = link['href']
      logo_source = urllib.request.urlopen(base_url + href).read()
      logo_soup = BeautifulSoup(logo_source, 'lxml')#.encode('utf-8')
      divs = logo_soup.find_all('div', class_="image")
      for div in divs:
        if div.has_attr('itemtype'):
          logo_div = div
          logo_img = logo_div.find('img')
          logo_url = base_url + logo_img['src']
          print(alt, logo_url)

          # download the logo
          urllib.request.urlretrieve(logo_url, "../img/logos/" + alt + ".png")
          count += 1
          time.sleep(0.1)

print(count)
    
    
    
    
  # print(link)

# print(urls.keys())
