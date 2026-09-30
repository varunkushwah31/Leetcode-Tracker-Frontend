# STAGE 1: Build the backend application
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /app

# Copy pom.xml and cache dependencies
COPY Backend/pom.xml ./
RUN mvn dependency:go-offline -B

# Copy source code and package
COPY Backend/src ./src
RUN mvn clean package -DskipTests

# STAGE 2: Run the application
FROM eclipse-temurin:25-jre
WORKDIR /app

# Copy the built jar from Stage 1
COPY --from=build /app/target/*.jar app.jar

# Render assigns PORT dynamically; default to 8080
ENV PORT=8080
EXPOSE 8080

# Memory tuning for Render's 512MB RAM free tier to prevent OOM kills
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"

# Run the app
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
