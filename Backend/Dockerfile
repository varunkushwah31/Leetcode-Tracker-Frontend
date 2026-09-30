# STAGE 1: Build the application
# Using Maven with Eclipse Temurin Java 25 to compile the code
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /app

# Copy the pom.xml and download dependencies first (this caches them!)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy your actual source code and build it
COPY src ./src
RUN mvn clean package -DskipTests

# STAGE 2: Run the application
# Using the lightweight Java 25 JRE to run the compiled jar
FROM eclipse-temurin:25-jre
WORKDIR /app

# Copy the built jar from Stage 1
COPY --from=build /app/target/*.jar app.jar

# Render assigns PORT dynamically; default to 8080 for local/docker-compose
ENV PORT=8080
EXPOSE 8080

# Tune JVM memory for Render's 512MB RAM free tier to prevent OOM (exit code 137)
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"

# Run the app: Spring Boot automatically picks up environment variables
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]