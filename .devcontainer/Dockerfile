FROM mcr.microsoft.com/devcontainers/java:1-21-bookworm

# Install Node.js 22 LTS and useful dev utilities
ARG NODE_VERSION=22
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        nodejs \
        redis-tools \
    && npm install -g npm@latest \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set up cache directories and permissions for vscode user
RUN mkdir -p /home/vscode/.m2 /home/vscode/.npm \
    && chown -R vscode:vscode /home/vscode/.m2 /home/vscode/.npm
