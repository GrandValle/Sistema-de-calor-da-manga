import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

export default function TabLayout() {
  const activeColor = "#4CAF50";
  const inactiveColor = "#888888";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: Platform.select({
          ios: { position: "absolute" },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "10 plantas",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="grass" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="14"
        options={{
          title: "14 plantas",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="leaf" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="18"
        options={{
          title: "18 plantas",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="sprout" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="update"
        options={{
          title: "Sincronizar",
          tabBarActiveTintColor: "blue",
          tabBarInactiveTintColor: "gray",
          tabBarIcon: ({ focused, size }) => (
            <MaterialCommunityIcons
              name="database"
              color={focused ? "blue" : "gray"}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
