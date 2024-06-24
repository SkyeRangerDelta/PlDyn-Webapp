#===========================
#LCARS47 Docker Image Config
#===========================
FROM nginx:latest
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

# Copy static web data from dist into nginx
COPY ./dist/pldyn-webapp/browser /usr/share/nginx/html
