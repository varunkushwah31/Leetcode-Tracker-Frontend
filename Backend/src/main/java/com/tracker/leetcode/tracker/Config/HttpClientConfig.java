package com.tracker.leetcode.tracker.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.net.http.HttpClient;
import java.time.Duration;

/**
 * High-performance HTTP Client Configuration.
 * Configures persistent HTTP connection pooling and HTTP/2 support via Java's native HttpClient,
 * which integrates with Java 21+ Virtual Threads without thread pinning or blocking OS threads.
 */
@Configuration
public class HttpClientConfig {

    @Bean
    public RestTemplate restTemplate() {
        HttpClient httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_2)
                .connectTimeout(Duration.ofSeconds(6))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();

        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(15));

        return new RestTemplate(requestFactory);
    }
}
