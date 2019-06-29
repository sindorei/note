cmake_minimum_required(VERSION 3.8)
project(equation)

set(CMAKE_CXX_STANDARD 11)

set(SOURCE_FILES main.cpp equation.cpp equation.h)
add_executable(equation ${SOURCE_FILES})