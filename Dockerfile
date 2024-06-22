#===========================
#LCARS47 Docker Image Config
#===========================
FROM node:20-alpine
LABEL   authors="SkyeRangerDelta" \
        version="1.0.0" \
        description="Official PlDyn Website/app" \
        vendor="Planetary Dynamics" \
        org.opencontainers.image.source="https://github.com/SkyeRangerDelta/PlDyn-Webapp" \
        org.opencontainers.image.description="The Official PlDyn Webapp"

#===========================
#Setup environment
#===========================
WORKDIR /PlDyn-Webapp
COPY package*.json ./
RUN npm ci
COPY . .

#===========================
#Post & Run
#===========================

CMD ["npm", "run", "start"]
