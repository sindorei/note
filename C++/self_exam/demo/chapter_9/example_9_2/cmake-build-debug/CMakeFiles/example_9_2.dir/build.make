# CMAKE generated file: DO NOT EDIT!
# Generated by "Unix Makefiles" Generator, CMake Version 3.8

# Delete rule output on recipe failure.
.DELETE_ON_ERROR:


#=============================================================================
# Special targets provided by cmake.

# Disable implicit rules so canonical targets will work.
.SUFFIXES:


# Remove some rules from gmake that .SUFFIXES does not remove.
SUFFIXES =

.SUFFIXES: .hpux_make_needs_suffix_list


# Suppress display of executed commands.
$(VERBOSE).SILENT:


# A target that is always out of date.
cmake_force:

.PHONY : cmake_force

#=============================================================================
# Set environment variables for the build.

# The shell in which to execute make rules.
SHELL = /bin/sh

# The CMake executable.
CMAKE_COMMAND = /Applications/CLion.app/Contents/bin/cmake/bin/cmake

# The command to remove a file.
RM = /Applications/CLion.app/Contents/bin/cmake/bin/cmake -E remove -f

# Escaping for special characters.
EQUALS = =

# The top-level source directory on which CMake was run.
CMAKE_SOURCE_DIR = /Users/sindorei/GitProj/note/C++/self_exam/demo/chapter_9/example_9_2

# The top-level build directory on which CMake was run.
CMAKE_BINARY_DIR = /Users/sindorei/GitProj/note/C++/self_exam/demo/chapter_9/example_9_2/cmake-build-debug

# Include any dependencies generated for this target.
include CMakeFiles/example_9_2.dir/depend.make

# Include the progress variables for this target.
include CMakeFiles/example_9_2.dir/progress.make

# Include the compile flags for this target's objects.
include CMakeFiles/example_9_2.dir/flags.make

CMakeFiles/example_9_2.dir/main.cpp.o: CMakeFiles/example_9_2.dir/flags.make
CMakeFiles/example_9_2.dir/main.cpp.o: ../main.cpp
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --progress-dir=/Users/sindorei/GitProj/note/C++/self_exam/demo/chapter_9/example_9_2/cmake-build-debug/CMakeFiles --progress-num=$(CMAKE_PROGRESS_1) "Building CXX object CMakeFiles/example_9_2.dir/main.cpp.o"
	/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/c++  $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -o CMakeFiles/example_9_2.dir/main.cpp.o -c /Users/sindorei/GitProj/note/C++/self_exam/demo/chapter_9/example_9_2/main.cpp

CMakeFiles/example_9_2.dir/main.cpp.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Preprocessing CXX source to CMakeFiles/example_9_2.dir/main.cpp.i"
	/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -E /Users/sindorei/GitProj/note/C++/self_exam/demo/chapter_9/example_9_2/main.cpp > CMakeFiles/example_9_2.dir/main.cpp.i

CMakeFiles/example_9_2.dir/main.cpp.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Compiling CXX source to assembly CMakeFiles/example_9_2.dir/main.cpp.s"
	/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -S /Users/sindorei/GitProj/note/C++/self_exam/demo/chapter_9/example_9_2/main.cpp -o CMakeFiles/example_9_2.dir/main.cpp.s

CMakeFiles/example_9_2.dir/main.cpp.o.requires:

.PHONY : CMakeFiles/example_9_2.dir/main.cpp.o.requires

CMakeFiles/example_9_2.dir/main.cpp.o.provides: CMakeFiles/example_9_2.dir/main.cpp.o.requires
	$(MAKE) -f CMakeFiles/example_9_2.dir/build.make CMakeFiles/example_9_2.dir/main.cpp.o.provides.build
.PHONY : CMakeFiles/example_9_2.dir/main.cpp.o.provides

CMakeFiles/example_9_2.dir/main.cpp.o.provides.build: CMakeFiles/example_9_2.dir/main.cpp.o


# Object files for target example_9_2
example_9_2_OBJECTS = \
"CMakeFiles/example_9_2.dir/main.cpp.o"

# External object files for target example_9_2
example_9_2_EXTERNAL_OBJECTS =

example_9_2: CMakeFiles/example_9_2.dir/main.cpp.o
example_9_2: CMakeFiles/example_9_2.dir/build.make
example_9_2: CMakeFiles/example_9_2.dir/link.txt
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --bold --progress-dir=/Users/sindorei/GitProj/note/C++/self_exam/demo/chapter_9/example_9_2/cmake-build-debug/CMakeFiles --progress-num=$(CMAKE_PROGRESS_2) "Linking CXX executable example_9_2"
	$(CMAKE_COMMAND) -E cmake_link_script CMakeFiles/example_9_2.dir/link.txt --verbose=$(VERBOSE)

# Rule to build all files generated by this target.
CMakeFiles/example_9_2.dir/build: example_9_2

.PHONY : CMakeFiles/example_9_2.dir/build

CMakeFiles/example_9_2.dir/requires: CMakeFiles/example_9_2.dir/main.cpp.o.requires

.PHONY : CMakeFiles/example_9_2.dir/requires

CMakeFiles/example_9_2.dir/clean:
	$(CMAKE_COMMAND) -P CMakeFiles/example_9_2.dir/cmake_clean.cmake
.PHONY : CMakeFiles/example_9_2.dir/clean

CMakeFiles/example_9_2.dir/depend:
	cd /Users/sindorei/GitProj/note/C++/self_exam/demo/chapter_9/example_9_2/cmake-build-debug && $(CMAKE_COMMAND) -E cmake_depends "Unix Makefiles" /Users/sindorei/GitProj/note/C++/self_exam/demo/chapter_9/example_9_2 /Users/sindorei/GitProj/note/C++/self_exam/demo/chapter_9/example_9_2 /Users/sindorei/GitProj/note/C++/self_exam/demo/chapter_9/example_9_2/cmake-build-debug /Users/sindorei/GitProj/note/C++/self_exam/demo/chapter_9/example_9_2/cmake-build-debug /Users/sindorei/GitProj/note/C++/self_exam/demo/chapter_9/example_9_2/cmake-build-debug/CMakeFiles/example_9_2.dir/DependInfo.cmake --color=$(COLOR)
.PHONY : CMakeFiles/example_9_2.dir/depend

