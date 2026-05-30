//
//  ContentView.swift
//  War Card Game
//
//  Created by Dom Ventas on 03/05/26.
//

import SwiftUI

struct ContentView: View {
    
    @State var playercard = "card13"
    @State var cpucard = "card10"
    @State var playerscore = 0
    @State var cpuscore = 0
    
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
                    Image(playercard)
                    Spacer()
                    Image(cpucard)
                    Spacer()
                }
                Spacer()
                
                // Button
                Button {
                    dealCards()
                    
                } label: {
                    Image("button")
                }
                
                Spacer()
                
                // Scores
                HStack{
                    Spacer()
                    VStack{
                        Text("Player")
                            .font(.headline)
                            .padding(.bottom)
                        Text(String(playerscore))
                            .font(.largeTitle)
                    }
                    Spacer()
                    VStack{
                        Text("CPU")
                            .font(.headline)
                            .padding(.bottom)
                        Text(String(cpuscore))
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
    
    func dealCards(){
        // Randomize card values
        var playerValue = Int.random(in: 2...14)
        var cpuValue = Int.random(in: 2...14)
        
        // Update the card images
        playercard = "card" + String(playerValue)
        cpucard = "card" + String(cpuValue)
        
        // Calculate the score
        if playerValue > cpuValue {
            playerscore += 1
        } else if cpuValue > playerValue {
            cpuscore += 1
        } else{
            cpuscore+=1
            playerscore+=1
        }
        
        
        // Update the score label
        
    }
}

#Preview {
    ContentView()
}
