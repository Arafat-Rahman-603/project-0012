import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography } from "@/constants/Colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.amber,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: Typography.bodyMedium,
          fontSize: 11,
        },
        tabBarStyle: {
          backgroundColor: Colors.cream,
          borderTopWidth: 1,
          borderTopColor: "rgba(26,26,26,0.08)",
          height: 64,
          paddingBottom: 12,
          paddingTop: 6,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products/index"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Wishlist",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bag-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
        }}
      />
      {/* Hide these from tab bar but keep accessible */}
      <Tabs.Screen
        name="products/[id]"
        options={{
          href: null,
          tabBarItemStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="orders/index"
        options={{
          href: null,
          tabBarItemStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="orders/[id]"
        options={{
          href: null,
          tabBarItemStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          href: null,
          tabBarItemStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}
