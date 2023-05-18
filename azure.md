
Docker
######

docker login

docker tag wayfarer-demo geographika/wayfarer-demo:main
docker push geographika/wayfarer-demo:main

docker tag wayfarer geographika/wayfarer:main
docker push geographika/wayfarer:main

# https://hub.docker.com/r/geographika/wayfarer-demo

docker compose down

# tag for Azure

az acr show --name wayfarercr --query loginServer --output table
docker images
# docker context use default

docker tag wayfarer wayfarercr.azurecr.io/wayfarer:main
docker tag wayfarer-demo wayfarercr.azurecr.io/wayfarer-demo:main

az acr login --name wayfarercr
docker push wayfarercr.azurecr.io/wayfarer:main
docker push wayfarercr.azurecr.io/wayfarer-demo:main

az acr repository list --name wayfarercr --output table

Azure
#####

# https://learn.microsoft.com/en-us/azure/container-instances/container-instances-tutorial-prepare-acr
# https://learn.microsoft.com/en-us/azure/container-instances/tutorial-docker-compose
# https://portal.azure.com/#@compass.ie/resource/subscriptions/2862d8a4-2556-40fb-b313-ad8f8dffb34e/r
# https://docs.docker.com/cloud/aci-integration/

az login

# create a resource group
az account list-locations
az group create --name wayfarer-resource-group --location westeurope

# create a container registry
az acr create --resource-group wayfarer-resource-group --name wayfarercr --sku Basic
az acr login --name wayfarercr


docker compose up --build -d
docker compose push
docker login azure
docker context create aci myacicontext
docker context use myacicontext
docker compose up

docker ps
docker compose down


docker logs wayfarer-demo_wayfarer-frontend

