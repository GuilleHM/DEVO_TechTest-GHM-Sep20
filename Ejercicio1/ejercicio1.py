import math


def perfect_number(ls):
    '''
    Takes a list of numbers and print by console for each one if it's a perfect, defective or abundant number.
    This classification is done by summing all divisors of the number up (except the number itself).
    It makes only sense for positive integers.

    Parameters:
        ls: A list of numbers.

    Returns:
        None.   
    '''

    for num in ls:

        if not isinstance(num, int) or num <= 0:
            print(num, 'is not a positive integer')

        else:
            # If k is a divisor of n then n/k is as well. For each pair (k, n/k) of divisors, 
            # one of the divisors is at most sqrt(n) and the other divisor is at least sqrt(n).
            # Thus, we just need to iterate up to the biggest integer that is less or equal to sqrt(n)
            root = math.floor(math.sqrt(num))

            divisors = [1]  # All numbers are divisible by one

            for i in range(2, root+1):
                if num % i == 0:
                    # Add the pair of divisors, except for exact square root of "num" (in case it exists)
                    # that is added only once (this exception case is covered by replacing "num // i" by 0)
                    divisors.extend((i, num // i if i*i != num else 0))

            sum_of_divisors = sum(divisors)

            if sum_of_divisors < num or num == 1:
                print(num, 'is a defective number')
            elif sum_of_divisors == num:
                print(num, 'is a perfect number')
            else:
                print(num, 'is an abundant number')
