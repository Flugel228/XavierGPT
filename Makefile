build:
    docker build -t xaviergptbot .

run:
    docker run -d -p 3000:3000 --name xaviergptbot --rm xaviergptbot