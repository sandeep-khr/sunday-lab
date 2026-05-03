//
//  ContentView.swift
//  War Card Game
//
//  Created by Dom Ventas on 03/05/26.
//

import SwiftUI

struct ContentView: View {
    var body: some View {
        ZStack{
            Image("background-plain")
            
            VStack {
                Spacer()
                // Logo
                Image("logo")
                Spacer()
                
                // Cards
                HStack{
                    Spacer()
                    Image("card3")
                    Spacer()
                    Image("card11")
                    Spacer()
                }
                Spacer()
                
                // Button
                Image("button")
                Spacer()
                
                // Scores
                HStack{
                    Spacer()
                    VStack{
                        Text("Player")
                            .font(.headline)
                            .padding(.bottom)
                        Text("0")
                            .font(.largeTitle)
                    }
                    Spacer()
                    VStack{
                        Text("CPU")
                            .font(.headline)
                            .padding(.bottom)
                        Text("0")
                            .font(.largeTitle)
                    }
                    Spacer()
                }
                .foregroundStyle(.white)
                Spacer()
                
            }
            .padding()
            
        }
    }
}

#Preview {
    ContentView()
}
