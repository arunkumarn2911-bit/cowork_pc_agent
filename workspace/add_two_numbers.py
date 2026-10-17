# Python program to add two numbers

def add_numbers(num1, num2):
    """Function to return the sum of two numbers."""
    return num1 + num2

if __name__ == "__main__":
    # Test values
    number1 = 15
    number2 = 27
    total = add_numbers(number1, number2)
    print(f"The sum of {number1} and {number2} is: {total}")
