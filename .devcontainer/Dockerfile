FROM mcr.microsoft.com/devcontainers/java:1-21-bookworm

# Fix: Remove expired Yarn repository from Microsoft base image that causes APT GPG NO_PUBKEY errors
RUN rm -f /etc/apt/sources.list.d/yarn.list /etc/apt/sources.list.d/*yarn*

# Install Node.js 22 LTS, redis-tools, and dev utilities via official NodeSource repository
ARG NODE_VERSION=22
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl gnupg redis-tools \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_VERSION}.x nodistro main" > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && npm install -g npm@latest \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set up cache directories and permissions for vscode user
RUN mkdir -p /home/vscode/.m2 /home/vscode/.npm \
    && chown -R vscode:vscode /home/vscode/.m2 /home/vscode/.npm
