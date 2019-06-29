cmake_minimum_required(VERSION 3.8)
project(demo)

set(CMAKE_CXX_STANDARD 11)

set(SOURCE_FILES chapter_5/example_5_10/main.cpp chapter_5/example_5_11/main.cpp)
add_executable(demo ${SOURCE_FILES})